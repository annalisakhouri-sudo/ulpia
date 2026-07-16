import { createServiceClient } from "@/lib/supabase/service";

const CATEGORY_LABELS: Record<string, string> = {
  bilan: "Bilan comptable",
  kbis: "K-bis",
  attestation: "Attestation",
  autre: "Autre",
};

export default async function DossierAccesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: permission } = await supabase
    .from("dossier_permissions")
    .select("id, expires_at, dossiers(id, name, company_id, companies(name)), interlocutors(name)")
    .eq("access_token", token)
    .single();

  const isExpired =
    permission?.expires_at && new Date(permission.expires_at) < new Date();

  if (!permission || isExpired) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <p className="font-display text-2xl mb-2">Lien invalide</p>
          <p className="text-sm text-ink-soft">
            Ce lien d&apos;accès n&apos;existe pas, a expiré, ou l&apos;accès a été retiré.
            Contactez l&apos;entreprise qui vous l&apos;a partagé pour obtenir un nouveau lien.
          </p>
        </div>
      </main>
    );
  }

  const dossier = permission.dossiers as unknown as {
    id: string;
    name: string;
    company_id: string;
    companies: { name: string } | null;
  };
  const interlocutorName = (permission.interlocutors as unknown as { name: string } | null)?.name;

  try {
    await supabase.from("access_logs").insert({
      company_id: dossier.company_id,
      event_type: "dossier_viewed",
      actor: interlocutorName ?? "Interlocuteur",
      dossier_name: dossier.name,
      interlocutor_name: interlocutorName ?? null,
    });
  } catch {
    // Le journal ne doit jamais bloquer l'accès au dossier.
  }

  const { data: links } = await supabase
    .from("document_dossiers")
    .select("documents(id, name, category, storage_path)")
    .eq("dossier_id", dossier.id);

  const documents = (links ?? [])
    .map(
      (l) =>
        l.documents as unknown as {
          id: string;
          name: string;
          category: string;
          storage_path: string;
        } | null
    )
    .filter(
      (d): d is { id: string; name: string; category: string; storage_path: string } =>
        d !== null
    );

  const documentsWithLinks = await Promise.all(
    documents.map(async (doc) => {
      const { data: signedUrl } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 60 * 10);
      return { ...doc, url: signedUrl?.signedUrl ?? null };
    })
  );

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md bg-surface border border-line rounded-lg p-8">
        <p className="text-xs text-ink-soft uppercase tracking-wide mb-1 text-center">
          Partagé par {dossier.companies?.name ?? "une entreprise"}
        </p>
        <h1 className="font-display text-xl mb-6 text-center">{dossier.name}</h1>

        {documentsWithLinks.length === 0 ? (
          <p className="text-sm text-ink-soft text-center">
            Ce dossier ne contient aucun document pour l&apos;instant.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {documentsWithLinks.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-ink">{doc.name}</p>
                  <p className="text-xs text-ink-soft">
                    {CATEGORY_LABELS[doc.category] ?? doc.category}
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
      </div>
    </main>
  );
}
