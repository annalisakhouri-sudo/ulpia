export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DossierDocumentsManager } from "./dossier-documents-manager";
import { DossierPermissionManager } from "./dossier-permission-manager";

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("id, name, created_at, required_categories")
    .eq("id", id)
    .single();

  if (!dossier) notFound();

  const { data: links } = await supabase
    .from("document_dossiers")
    .select("document_id, documents(id, name, category)")
    .eq("dossier_id", id);

  const documentsInDossier = (links ?? [])
    .map((l) => l.documents as unknown as { id: string; name: string; category: string } | null)
    .filter((d): d is { id: string; name: string; category: string } => d !== null);

  const inDossierIds = new Set(documentsInDossier.map((d) => d.id));

  const { data: allDocuments } = await supabase
    .from("documents")
    .select("id, name, category")
    .order("name");

  const availableDocuments = (allDocuments ?? []).filter((d) => !inDossierIds.has(d.id));

  const { data: interlocutors } = await supabase
    .from("interlocutors")
    .select("id, name, organization_type")
    .order("name");

  const { data: permissions } = await supabase
    .from("dossier_permissions")
    .select("id, access_token, interlocutors(id, name, organization_type)")
    .eq("dossier_id", id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const requiredCategories: string[] = dossier.required_categories ?? [];
  const presentCategories = new Set(
    documentsInDossier.map((d) => d.category.toLowerCase().trim())
  );
  const checklist = requiredCategories.map((cat) => ({
    category: cat,
    present: presentCategories.has(cat.toLowerCase().trim()),
  }));
  const missingCount = checklist.filter((c) => !c.present).length;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl">{dossier.name}</h1>
      <p className="text-sm text-ink-soft mt-1 mb-8">
        Créé le {new Date(dossier.created_at).toLocaleDateString("fr-FR")}
      </p>

      {checklist.length > 0 && (
        <div
          className={`mb-6 rounded-lg p-4 border ${
            missingCount === 0
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <p
            className={`text-sm font-medium mb-2 ${
              missingCount === 0 ? "text-emerald-900" : "text-amber-900"
            }`}
          >
            {missingCount === 0
              ? "Dossier complet"
              : `${missingCount} type${missingCount > 1 ? "s" : ""} de document manquant${
                  missingCount > 1 ? "s" : ""
                }`}
          </p>
          <ul className="space-y-1">
            {checklist.map((item) => (
              <li
                key={item.category}
                className={`text-xs flex items-center gap-2 ${
                  item.present ? "text-emerald-800" : "text-amber-800"
                }`}
              >
                <span>{item.present ? "✓" : "○"}</span>
                {item.category}
              </li>
            ))}
          </ul>
        </div>
      )}

      <DossierDocumentsManager
        dossierId={dossier.id}
        documentsInDossier={documentsInDossier}
        availableDocuments={availableDocuments}
      />

      <DossierPermissionManager
        dossierId={dossier.id}
        interlocutors={interlocutors ?? []}
        permissions={
          (permissions ?? []) as unknown as {
            id: string;
            access_token: string;
            interlocutors: { id: string; name: string; organization_type: string } | null;
          }[]
        }
        siteUrl={siteUrl}
      />
    </div>
  );
}
