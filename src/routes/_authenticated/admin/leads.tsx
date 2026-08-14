import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchLeads, type Lead } from "@/lib/leads";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({
    meta: [
      { title: "Заявки — админка Avicenna" },
      { name: "description", content: "Заявки с попапов и форм сайта." },
      { property: "og:title", content: "Заявки — админка Avicenna" },
      { property: "og:description", content: "Список заявок пациентов с сайта Avicenna." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLeads,
});

const STATUS_LABEL: Record<string, string> = {
  new: "Новая",
  contacted: "Связались",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminLeads() {
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["leads"] }),
    onError: (e: Error) => toast.error(e.message),
  });

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
            <h1 className="text-foreground text-2xl font-semibold">Заявки</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Заявки, которые оставили посетители через попап на сайте.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/popups">Попапы</Link>
            </Button>
            <Button variant="ghost" onClick={signOut}>
              Выйти
            </Button>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {isLoading && <p className="text-muted-foreground text-sm">Загрузка…</p>}
          {leads?.length === 0 && <p className="text-muted-foreground text-sm">Заявок пока нет.</p>}
          {leads?.map((lead: Lead) => (
            <div
              key={lead.id}
              className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
            >
              <div>
                <p className="text-foreground font-semibold">{lead.name || "Без имени"}</p>
                <a href={`tel:${lead.phone}`} className="text-brand-green text-sm font-medium">
                  {lead.phone}
                </a>
                <p className="text-muted-foreground mt-1 text-xs">{formatDate(lead.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    lead.status === "contacted"
                      ? "bg-surface-green text-brand-green rounded-full px-3 py-1 text-xs font-semibold"
                      : "bg-surface-soft text-foreground rounded-full px-3 py-1 text-xs font-semibold"
                  }
                >
                  {STATUS_LABEL[lead.status] ?? lead.status}
                </span>
                {lead.status !== "contacted" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus.mutate({ id: lead.id, status: "contacted" })}
                  >
                    Связались
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
