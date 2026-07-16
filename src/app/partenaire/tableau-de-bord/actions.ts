"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function submitPartnerDemande(formData: FormData) {
  const interlocutorId = String(formData.get("interlocutorId"));
  const category = String(formData.get("category"));
  const message = String(formData.get("message") || "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const service = createServiceClient();

  // Vérifie que cette ligne "interlocutors" appartient bien à l'email de la personne connectée,
  // pour éviter qu'on puisse formuler une demande au nom de quelqu'un d'autre.
  const { data: interlocutor } = await service
    .from("interlocutors")
    .select("id, company_id, name, email")
    .eq("id", interlocutorId)
    .single();

  if (!interlocutor || interlocutor.email !== user.email) {
    return { error: "Accès refusé." };
  }

  const { error } = await service.from("demandes").insert({
    company_id: interlocutor.company_id,
    interlocutor_id: interlocutor.id,
    category,
    message: message || null,
  });

  if (error) return { error: error.message };

  try {
    await service.from("access_logs").insert({
      company_id: interlocutor.company_id,
      event_type: "demande_created",
      actor: interlocutor.name,
      interlocutor_name: interlocutor.name,
    });
  } catch {
    // Le journal ne doit jamais bloquer la demande.
  }

  revalidatePath("/partenaire/tableau-de-bord");
  return { success: true };
}
