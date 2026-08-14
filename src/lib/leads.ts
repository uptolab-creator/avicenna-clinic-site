import { supabase } from "@/integrations/supabase/client";

export type NewLead = {
  popup_id: string | null;
  name: string;
  phone: string;
  consent: boolean;
};

export async function submitLead(lead: NewLead): Promise<void> {
  const { error } = await supabase.from("leads").insert(lead);
  if (error) throw error;
}

export type Lead = {
  id: string;
  popup_id: string | null;
  name: string | null;
  phone: string;
  consent: boolean;
  status: string;
  created_at: string;
};

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, popup_id, name, phone, consent, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
