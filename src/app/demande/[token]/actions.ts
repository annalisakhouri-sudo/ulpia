"use server";

import { createServiceClient } from "@/lib/supabase/service";

export async function submitDemande(formData: FormData) {
  const token = String(formData.get("token"));
  const category = String(formData.get("category"));
  const message = String(formData.get("message") || "");

  const supabase = createServiceClient();

  const { data: interlocutor } = await supabase
    .from("interlocutors")
    .select("id, company_id, name")
    .eq("request_token", token)
    .single();

  if (!interlocutor) {
    return { error: "Lien invalide." };
  }

  const { error } = await supabase.from("demandes").insert({
    company_id: interlocutor.company_id,
    interlocutor_id: interlocutor.id,
    category,
    message: message || null,
  });

  if (error) return { error: error.message };

  try {
    await supabase.from("access_logs").insert({
      company_id: interlocutor.company_id,
      event_type: "demande_created",
      actor: interlocutor.name,
      interlocutor_name: interlocutor.name,
    });
  } catch {
    // Le journal ne doit jamais bloquer la demande.
  }

  return { success: true };
}
