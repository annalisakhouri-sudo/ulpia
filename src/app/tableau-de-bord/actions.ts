"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, company_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profil introuvable.");
  return { supabase, profile };
}

// Enregistre un événement dans le journal d'accès. Ne bloque jamais l'action principale
// si l'écriture du log échoue (le journal est un plus, pas une dépendance critique).
async function logEvent(
  supabase: SupabaseClient,
  companyId: string,
  eventType: string,
  details: {
    actor?: string;
    documentName?: string;
    dossierName?: string;
    interlocutorName?: string;
  } = {}
) {
  try {
    await supabase.from("access_logs").insert({
      company_id: companyId,
      event_type: eventType,
      actor: details.actor ?? "Vous",
      document_name: details.documentName ?? null,
      dossier_name: details.dossierName ?? null,
      interlocutor_name: details.interlocutorName ?? null,
    });
  } catch {
    // Le journal ne doit jamais faire échouer l'action principale.
  }
}

export async function uploadDocument(formData: FormData) {
  const { supabase, profile } = await getProfile();

  const file = formData.get("file") as File;
  const name = String(formData.get("name") || file.name);
  const category = String(formData.get("category") || "autre");
  const expiresAtRaw = String(formData.get("expiresAt") || "");
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null;

  if (!file || file.size === 0) {
    return { error: "Aucun fichier sélectionné." };
  }

  const storagePath = `${profile.company_id}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file);

  if (uploadError) {
    return { error: `Échec de l'envoi : ${uploadError.message}` };
  }

  const { error: insertError } = await supabase.from("documents").insert({
    company_id: profile.company_id,
    name,
    category,
    storage_path: storagePath,
    uploaded_by: profile.id,
    expires_at: expiresAt,
  });

  if (insertError) {
    return { error: `Échec de l'enregistrement : ${insertError.message}` };
  }

  await logEvent(supabase, profile.company_id, "document_deposited", { documentName: name });

  revalidatePath("/tableau-de-bord");
  return { success: true };
}

export async function updateDocumentExpiry(documentId: string, expiresAtRaw: string) {
  const { supabase, profile } = await getProfile();

  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw).toISOString() : null;

  const { error } = await supabase
    .from("documents")
    .update({ expires_at: expiresAt })
    .eq("id", documentId);

  if (error) return { error: error.message };

  const { data: doc } = await supabase.from("documents").select("name").eq("id", documentId).single();

  await logEvent(supabase, profile.company_id, "document_expiry_updated", {
    documentName: doc?.name,
  });

  revalidatePath(`/tableau-de-bord/documents/${documentId}`);
  revalidatePath("/tableau-de-bord");
  return { success: true };
}

export async function deleteDocument(documentId: string, storagePath: string) {
  const { supabase, profile } = await getProfile();

  const { data: doc } = await supabase.from("documents").select("name").eq("id", documentId).single();

  await supabase.storage.from("documents").remove([storagePath]);
  await supabase.from("documents").delete().eq("id", documentId);

  await logEvent(supabase, profile.company_id, "document_deleted", { documentName: doc?.name });

  revalidatePath("/tableau-de-bord");
}

export async function addInterlocutor(formData: FormData) {
  const { supabase, profile } = await getProfile();

  const name = String(formData.get("name"));
  const email = String(formData.get("email") || "");
  const organizationType = String(formData.get("organizationType") || "autre");

  if (!name) return { error: "Le nom est requis." };

  const { error } = await supabase.from("interlocutors").insert({
    company_id: profile.company_id,
    name,
    email: email || null,
    organization_type: organizationType,
  });

  if (error) return { error: error.message };

  await logEvent(supabase, profile.company_id, "interlocutor_added", { interlocutorName: name });

  revalidatePath("/tableau-de-bord/interlocuteurs");
  return { success: true };
}

export async function grantPermission(documentId: string, interlocutorId: string) {
  const { supabase, profile } = await getProfile();

  const { error } = await supabase.from("permissions").insert({
    document_id: documentId,
    interlocutor_id: interlocutorId,
  });

  if (error) return { error: error.message };

  const [{ data: doc }, { data: interlocutor }] = await Promise.all([
    supabase.from("documents").select("name").eq("id", documentId).single(),
    supabase.from("interlocutors").select("name").eq("id", interlocutorId).single(),
  ]);

  await logEvent(supabase, profile.company_id, "permission_granted", {
    documentName: doc?.name,
    interlocutorName: interlocutor?.name,
  });

  revalidatePath(`/tableau-de-bord/documents/${documentId}`);
  return { success: true };
}

export async function revokePermission(permissionId: string, documentId: string) {
  const { supabase, profile } = await getProfile();

  const { data: permission } = await supabase
    .from("permissions")
    .select("interlocutors(name), documents(name)")
    .eq("id", permissionId)
    .single();

  await supabase.from("permissions").delete().eq("id", permissionId);

  const interlocutorName = (permission?.interlocutors as unknown as { name: string } | null)?.name;
  const documentName = (permission?.documents as unknown as { name: string } | null)?.name;

  await logEvent(supabase, profile.company_id, "permission_revoked", {
    documentName,
    interlocutorName,
  });

  revalidatePath(`/tableau-de-bord/documents/${documentId}`);
}

export async function createDossier(formData: FormData) {
  const { supabase, profile } = await getProfile();

  const name = String(formData.get("name") || "");
  if (!name) return { error: "Le nom du dossier est requis." };

  const requiredCategoriesRaw = String(formData.get("requiredCategories") || "");
  const requiredCategories = requiredCategoriesRaw
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const { error } = await supabase.from("dossiers").insert({
    company_id: profile.company_id,
    name,
    required_categories: requiredCategories,
  });

  if (error) return { error: error.message };

  await logEvent(supabase, profile.company_id, "dossier_created", { dossierName: name });

  revalidatePath("/tableau-de-bord/dossiers");
  return { success: true };
}

export async function deleteDossier(dossierId: string) {
  const { supabase, profile } = await getProfile();
  const { data: dossier } = await supabase.from("dossiers").select("name").eq("id", dossierId).single();
  await supabase.from("dossiers").delete().eq("id", dossierId);
  await logEvent(supabase, profile.company_id, "dossier_deleted", { dossierName: dossier?.name });
  revalidatePath("/tableau-de-bord/dossiers");
}

export async function addDocumentToDossier(dossierId: string, documentId: string) {
  const { supabase } = await getProfile();

  const { error } = await supabase
    .from("document_dossiers")
    .insert({ dossier_id: dossierId, document_id: documentId });

  if (error) return { error: error.message };

  revalidatePath(`/tableau-de-bord/dossiers/${dossierId}`);
  return { success: true };
}

export async function removeDocumentFromDossier(dossierId: string, documentId: string) {
  const { supabase } = await getProfile();
  await supabase
    .from("document_dossiers")
    .delete()
    .eq("dossier_id", dossierId)
    .eq("document_id", documentId);
  revalidatePath(`/tableau-de-bord/dossiers/${dossierId}`);
}

export async function grantDossierPermission(dossierId: string, interlocutorId: string) {
  const { supabase, profile } = await getProfile();

  const { error } = await supabase.from("dossier_permissions").insert({
    dossier_id: dossierId,
    interlocutor_id: interlocutorId,
  });

  if (error) return { error: error.message };

  const [{ data: dossier }, { data: interlocutor }] = await Promise.all([
    supabase.from("dossiers").select("name").eq("id", dossierId).single(),
    supabase.from("interlocutors").select("name").eq("id", interlocutorId).single(),
  ]);

  await logEvent(supabase, profile.company_id, "dossier_permission_granted", {
    dossierName: dossier?.name,
    interlocutorName: interlocutor?.name,
  });

  revalidatePath(`/tableau-de-bord/dossiers/${dossierId}`);
  return { success: true };
}

export async function revokeDossierPermission(permissionId: string, dossierId: string) {
  const { supabase, profile } = await getProfile();

  const { data: permission } = await supabase
    .from("dossier_permissions")
    .select("interlocutors(name), dossiers(name)")
    .eq("id", permissionId)
    .single();

  await supabase.from("dossier_permissions").delete().eq("id", permissionId);

  const interlocutorName = (permission?.interlocutors as unknown as { name: string } | null)?.name;
  const dossierName = (permission?.dossiers as unknown as { name: string } | null)?.name;

  await logEvent(supabase, profile.company_id, "dossier_permission_revoked", {
    dossierName,
    interlocutorName,
  });

  revalidatePath(`/tableau-de-bord/dossiers/${dossierId}`);
}

export async function acceptDemande(demandeId: string, documentId: string) {
  const { supabase, profile } = await getProfile();

  const { data: demande } = await supabase
    .from("demandes")
    .select("interlocutor_id, category, interlocutors(name)")
    .eq("id", demandeId)
    .single();

  if (!demande) return { error: "Demande introuvable." };

  // Donne l'accès au document (comme un partage classique), et marque la demande comme acceptée.
  await supabase
    .from("permissions")
    .upsert(
      { document_id: documentId, interlocutor_id: demande.interlocutor_id },
      { onConflict: "document_id,interlocutor_id" }
    );

  await supabase
    .from("demandes")
    .update({ status: "acceptee", document_id: documentId, responded_at: new Date().toISOString() })
    .eq("id", demandeId);

  const { data: doc } = await supabase.from("documents").select("name").eq("id", documentId).single();
  const interlocutorName = (demande.interlocutors as unknown as { name: string } | null)?.name;

  await logEvent(supabase, profile.company_id, "demande_acceptee", {
    documentName: doc?.name,
    interlocutorName,
  });

  revalidatePath("/tableau-de-bord/demandes");
  return { success: true };
}

export async function refuseDemande(demandeId: string) {
  const { supabase, profile } = await getProfile();

  const { data: demande } = await supabase
    .from("demandes")
    .select("interlocutors(name)")
    .eq("id", demandeId)
    .single();

  await supabase
    .from("demandes")
    .update({ status: "refusee", responded_at: new Date().toISOString() })
    .eq("id", demandeId);

  const interlocutorName = (demande?.interlocutors as unknown as { name: string } | null)?.name;

  await logEvent(supabase, profile.company_id, "demande_refusee", {
    interlocutorName,
  });

  revalidatePath("/tableau-de-bord/demandes");
}
