import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { POPUPS_BUCKET, fetchAllPopups, type PopupWithUrl } from "@/lib/popups";

export const Route = createFileRoute("/_authenticated/admin/popups")({
  head: () => ({
    meta: [
      { title: "Попапы — админка Avicenna" },
      {
        name: "description",
        content: "Всплывающие предложения на сайте: акции, праздничные баннеры.",
      },
      { property: "og:title", content: "Попапы — админка Avicenna" },
      { property: "og:description", content: "Управление всплывающими попапами сайта Avicenna." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPopups,
});

function AdminPopups() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: popups, isLoading } = useQuery({
    queryKey: ["popups", "all"],
    queryFn: fetchAllPopups,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["popups"] });
    void queryClient.invalidateQueries({ queryKey: ["active-popup"] });
  };

  const update = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<
        Pick<
          PopupWithUrl,
          "title" | "body" | "button_text" | "button_url" | "sort_order" | "is_active"
        >
      >;
    }) => {
      const { error } = await supabase.from("popups").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (popup: PopupWithUrl) => {
      const { error } = await supabase.from("popups").delete().eq("id", popup.id);
      if (error) throw error;
      if (popup.image_url && !/^https?:\/\//i.test(popup.image_url)) {
        await supabase.storage.from(POPUPS_BUCKET).remove([popup.image_url]);
      }
    },
    onSuccess: () => {
      toast.success("Попап удалён");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createPopup = useMutation({
    mutationFn: async () => {
      const nextOrder = (popups?.length ?? 0) + 1;
      const { error } = await supabase.from("popups").insert({
        title: "Новый попап",
        is_active: false,
        sort_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Попап создан");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onUpload = async (popup: PopupWithUrl, file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `images/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(POPUPS_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      if (popup.image_url && !/^https?:\/\//i.test(popup.image_url)) {
        await supabase.storage.from(POPUPS_BUCKET).remove([popup.image_url]);
      }

      const { error } = await supabase
        .from("popups")
        .update({ image_url: path })
        .eq("id", popup.id);
      if (error) throw error;

      toast.success("Картинка загружена");
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  return (
    <div className="bg-background min-h-screen">
      <Toaster />
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">Попапы</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Всплывающие предложения — Новый год, 8 марта, 23 февраля и другие акции. Появляются
              через 30 секунд на сайте. Включайте только один актуальный попап за раз.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/hero">Баннер</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">На сайт</Link>
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Выйти
            </Button>
          </div>
        </div>

        <Button
          className="mt-6"
          onClick={() => createPopup.mutate()}
          disabled={createPopup.isPending}
        >
          Новый попап
        </Button>

        <div className="mt-8 space-y-4">
          {isLoading && <p className="text-muted-foreground text-sm">Загрузка…</p>}
          {popups?.length === 0 && (
            <p className="text-muted-foreground text-sm">Попапов пока нет.</p>
          )}
          {popups?.map((popup) => (
            <div
              key={popup.id}
              className="border-border grid gap-4 rounded-xl border p-4 sm:grid-cols-[160px_1fr]"
            >
              <div className="space-y-2">
                {popup.displayUrl ? (
                  <img
                    src={popup.displayUrl}
                    alt={popup.title}
                    loading="lazy"
                    className="h-24 w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="border-border bg-muted flex h-24 w-full items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                    Без картинки
                  </div>
                )}
                <Label className="text-xs">
                  <span className="mb-1 flex items-center gap-1">
                    <Upload className="size-3.5" aria-hidden="true" /> Картинка
                  </span>
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onUpload(popup, file);
                      e.target.value = "";
                    }}
                  />
                </Label>
              </div>
              <div className="space-y-3">
                <Input
                  defaultValue={popup.title}
                  placeholder="Заголовок"
                  onBlur={(e) => update.mutate({ id: popup.id, values: { title: e.target.value } })}
                />
                <Textarea
                  defaultValue={popup.body ?? ""}
                  placeholder="Текст предложения"
                  onBlur={(e) => update.mutate({ id: popup.id, values: { body: e.target.value } })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    defaultValue={popup.button_text ?? ""}
                    placeholder="Текст кнопки"
                    onBlur={(e) =>
                      update.mutate({ id: popup.id, values: { button_text: e.target.value } })
                    }
                  />
                  <Input
                    defaultValue={popup.button_url ?? ""}
                    placeholder="Ссылка кнопки (например /checkups)"
                    onBlur={(e) =>
                      update.mutate({ id: popup.id, values: { button_url: e.target.value } })
                    }
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`order-${popup.id}`} className="text-sm">
                      Порядок
                    </Label>
                    <Input
                      id={`order-${popup.id}`}
                      type="number"
                      className="w-20"
                      defaultValue={popup.sort_order}
                      onBlur={(e) =>
                        update.mutate({
                          id: popup.id,
                          values: { sort_order: Number(e.target.value) || 0 },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`active-${popup.id}`}
                      checked={popup.is_active}
                      onCheckedChange={(checked) =>
                        update.mutate({ id: popup.id, values: { is_active: checked } })
                      }
                    />
                    <Label htmlFor={`active-${popup.id}`} className="text-sm">
                      Показывать
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-brand-terracotta ml-auto"
                    onClick={() => remove.mutate(popup)}
                  >
                    <Trash2 className="mr-2 size-4" aria-hidden="true" />
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
