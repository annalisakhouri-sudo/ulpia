export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { partnerLogout } from "@/lib/partner-auth-actions";
import { NewDemandeForm } from "./new-demande-form";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  en_attente: { label: "En attente", className: "bg-brass-soft text-brass" },
  acceptee: { label: "Acceptée", className: "bg-emerald-50 text-emerald-700" },
  refusee: { label: "Refusée", className: "bg-red-50 text-red-700" },
};

export default async function PartenaireTableauDeBordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/partenaire/connexion");

  const service = createServiceClient();

  const { data: interlocutorRows } = await service
    .from("interlocutors")
    .select("id, name, organization_type, company_id, companies(name)")
    .eq("email", user.email);

  const relationships = await Promise.all(
    (interlocutorRows ?? []).map(async (row) => {
      const companyName = (row.companies as unknown as { name: string } | null)?.name ?? "Entreprise";

      const { data: docPermissions } = await service
        .from("permissions")
        .select("id, documents(id, name, category, storage_path, created_at)")
        .eq("interlocutor_id", row.id);

      const { data: dossierPermissions } = await service
        .from("dossier_permissions")
        .select("id, dossiers(id, name)")
        .eq("interlocutor_id", row.id);

      const { data: demandes } = await service
        .from("demandes")
        .select("id, category, status, created_at")
        .eq("interlocutor_id", row.id)
        .order("created_at", { ascending: false });

      const dossierRows = (dossierPermissions ?? [])
        .map((p) => p.dossiers as unknown as { id: string; name: string } | null)
        .filter((d): d is NonNullable<typeof d> => d !== null);

      const directDocs = (docPermissions ?? [])
        .map(
          (p) =>
            p.documents as unknown as {
              id: string;
              name: string;
              category: string;
              storage_path: string;
              created_at: string;
            } | null
        )
        .filter((d): d is NonNullable<typeof d> => d !== null);

      // Pour chaque dossier accessible, on va chercher les documents qu'il contient.
      const dossierDocsNested = await Promise.all(
        dossierRows.map(async (dossier) => {
          const { data: links } = await service
            .from("document_dossiers")
            .select("documents(id, name, category, storage_path, created_at)")
            .eq("dossier_id", dossier.id);

          return (links ?? [])
            .map(
              (l) =>
                l.documents as unknown as {
                  id: string;
                  name: string;
                  category: string;
                  storage_path: string;
                  created_at: string;
                } | null
            )
            .filter((d): d is NonNullable<typeof d> => d !== null);
        })
      );

      const allDocsMap = new Map<
        string,
        { id: string; name: string; category: string; storage_path: string; created_at: string }
      >();
      for (const doc of directDocs) allDocsMap.set(doc.id, doc);
      for (const docs of dossierDocsNested) for (const doc of docs) allDocsMap.set(doc.id, doc);

      const documentsWithLinks = await Promise.all(
        Array.from(allDocsMap.values()).map(async (doc) => {
          const { data: signed } = await service.storage
            .from("documents")
            .createSignedUrl(doc.storage_path, 60 * 10);
          return { ...doc, url: signed?.signedUrl ?? null };
        })
      );

      const dossiers = dossierRows;

      return {
        interlocutorId: row.id,
        companyName,
        organizationType: row.organization_type,
        documents: documentsWithLinks,
        dossiers,
        demandes: demandes ?? [],
      };
    })
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-display text-lg text-ink">ULPIA</p>
            <p className="text-xs text-ink-soft">Espace partenaire</p>
          </div>
          <form action={partnerLogout}>
            <button
              type="submit"
              className="text-sm text-ink-soft hover:text-ink border border-line rounded-md px-3 py-1.5 transition-colors"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-2xl mb-1">Vos accès</h1>
        <p className="text-sm text-ink-soft mb-8">
          Les entreprises qui vous ont ajouté(e) comme interlocuteur, et les documents auxquels
          vous avez accès chez chacune.
        </p>

        {relationships.length === 0 ? (
          <div className="bg-surface border border-line border-dashed rounded-lg p-12 text-center">
            <p className="text-ink-soft text-sm">
              Aucune entreprise ne vous a encore ajouté(e) avec cet email. Une fois que ce sera
              fait, vos accès apparaîtront ici automatiquement.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {relationships.map((rel) => (
              <div key={rel.interlocutorId} className="bg-surface border border-line rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-display text-lg">{rel.companyName}</p>
                    <p className="text-xs text-ink-soft">{rel.organizationType}</p>
                  </div>
                  <NewDemandeForm interlocutorId={rel.interlocutorId} />
                </div>

                {rel.dossiers.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-ink-soft uppercase tracking-wide mb-1">Dossiers</p>
                    <div className="flex flex-wrap gap-2">
                      {rel.dossiers.map((d) => (
                        <span
                          key={d.id}
                          className="text-xs bg-brass-soft text-brass rounded-full px-2.5 py-1"
                        >
                          {d.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {rel.documents.length === 0 ? (
                  <p className="text-sm text-ink-soft">Aucun document accessible pour l&apos;instant.</p>
                ) : (
                  <ul className="divide-y divide-line mb-2">
                    {rel.documents.map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-sm text-ink">{doc.name}</p>
                          <p className="text-xs text-ink-soft">
                            {doc.category} ·{" "}
                            {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        {doc.url ? (
                          <a
                            href={doc.url}
                            className="text-xs bg-ink text-white rounded-md px-3 py-1.5 font-medium hover:bg-ink/90 transition-colors"
                          >
                            Télécharger
                          </a>
                        ) : (
                          <span className="text-xs text-red-700">Indisponible</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {rel.demandes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-line">
                    <p className="text-xs text-ink-soft uppercase tracking-wide mb-2">
                      Vos demandes
                    </p>
                    <ul className="space-y-1.5">
                      {rel.demandes.map((d) => {
                        const status = STATUS_LABELS[d.status] ?? STATUS_LABELS.en_attente;
                        return (
                          <li key={d.id} className="flex items-center justify-between text-xs">
                            <span className="text-ink-soft">
                              {d.category} · {new Date(d.created_at).toLocaleDateString("fr-FR")}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 ${status.className}`}>
                              {status.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
