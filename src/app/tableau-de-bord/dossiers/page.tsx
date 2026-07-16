export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateDossierForm } from "./create-dossier-form";

export default async function DossiersPage() {
  const supabase = await createClient();

  const { data: dossiers } = await supabase
    .from("dossiers")
    .select(
      "id, name, created_at, required_categories, document_dossiers(documents(category)), dossier_permissions(id)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Dossiers</h1>
          <p className="text-sm text-ink-soft mt-1">
            Regroupez plusieurs documents pour les partager d&apos;un seul coup — par exemple un
            dossier de financement complet.
          </p>
        </div>
        <CreateDossierForm />
      </div>

      {!dossiers || dossiers.length === 0 ? (
        <div className="bg-surface border border-line border-dashed rounded-lg p-12 text-center">
          <p className="text-ink-soft text-sm">
            Aucun dossier pour l&apos;instant. Créez-en un pour regrouper vos documents.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-lg divide-y divide-line">
          {dossiers.map((d) => {
            const requiredCategories: string[] = d.required_categories ?? [];
            const presentCategories = new Set(
              (d.document_dossiers ?? [])
                .map((link) => (link.documents as unknown as { category: string } | null)?.category)
                .filter((c): c is string => Boolean(c))
                .map((c) => c.toLowerCase().trim())
            );
            const missingCount = requiredCategories.filter(
              (cat) => !presentCategories.has(cat.toLowerCase().trim())
            ).length;
            const docCount = d.document_dossiers?.length ?? 0;

            return (
              <Link
                key={d.id}
                href={`/tableau-de-bord/dossiers/${d.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-background/60 transition-colors"
              >
                <div>
                  <p className="text-sm text-ink font-medium">{d.name}</p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {docCount} document{docCount > 1 ? "s" : ""} ·{" "}
                    {new Date(d.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {requiredCategories.length > 0 && (
                    <span
                      className={`text-xs rounded-full px-2.5 py-1 ${
                        missingCount === 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {missingCount === 0 ? "Complet" : `${missingCount} manquant${missingCount > 1 ? "s" : ""}`}
                    </span>
                  )}
                  <span className="text-xs text-brass bg-brass-soft rounded-full px-2.5 py-1">
                    {d.dossier_permissions?.length ?? 0} accès accordé
                    {(d.dossier_permissions?.length ?? 0) > 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
