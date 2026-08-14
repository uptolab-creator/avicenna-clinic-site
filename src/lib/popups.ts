import { supabase } from "@/integrations/supabase/client";

export const POPUPS_BUCKET = "popups";

export type Popup = {
  id: string;
  title: string;
  body: string | null;
  image_url: string | null;
  button_text: string | null;
  note_text: string | null;
  is_active: boolean;
  sort_order: number;
};

export type PopupWithUrl = Popup & { displayUrl: string | null };

const isAbsolute = (value: string) => /^https?:\/\//i.test(value);

async function withDisplayUrl(popups: Popup[]): Promise<PopupWithUrl[]> {
  const paths = popups.map((p) => p.image_url).filter((p): p is string => !!p && !isAbsolute(p));

  const signed = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await supabase.storage
      .from(POPUPS_BUCKET)
      .createSignedUrls(paths, 60 * 60 * 6);
    data?.forEach((item) => {
      if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
    });
  }

  return popups.map((popup) => ({
    ...popup,
    displayUrl: popup.image_url
      ? isAbsolute(popup.image_url)
        ? popup.image_url
        : (signed.get(popup.image_url) ?? null)
      : null,
  }));
}

/** Активный попап с наименьшим sort_order, если он есть. */
export async function fetchActivePopup(): Promise<PopupWithUrl | null> {
  const { data, error } = await supabase
    .from("popups")
    .select("id, title, body, image_url, button_text, note_text, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return null;
  const [withUrl] = await withDisplayUrl(data);
  return withUrl ?? null;
}

export async function fetchAllPopups(): Promise<PopupWithUrl[]> {
  const { data, error } = await supabase
    .from("popups")
    .select("id, title, body, image_url, button_text, note_text, is_active, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return withDisplayUrl(data ?? []);
}
