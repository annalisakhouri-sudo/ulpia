import { createServiceClient } from "@/lib/supabase/service";

const CATEGORY_LABELS: Record<string, string> = {
  bilan: "Bilan comptable",
  kbis: "K-bis",
  attestation: "Attestation",
  autre: "Autre",
};

export default async function AccesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: permission } = await supabase
    .from("permissions")
    .select(
      "id, expires_at, documents(id, name, category, storage_path, company_id, companies(name)), interlocutors(name)"
    )
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

  const doc = permission.documents as unknown as {
    id: string;
    name: string;
    category: string;
    storage_path: string;
    company_id: string;
    companies: { name: string } | null;
  };
  const interlocutorName = (permission.interlocutors as unknown as { name: string } | null)?.name;

  try {
    await supabase.from("access_logs").insert({
      company_id: doc.company_id,
      event_type: "document_viewed",
      actor: interlocutorName ?? "Interlocuteur",
      document_name: doc.name,
      interlocutor_name: interlocutorName ?? null,
    });
  } catch {
    // Le journal ne doit jamais bloquer l'accès au document.
  }

  const { data: signedUrl } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.storage_path, 60 * 10); // valide 10 minutes

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm bg-surface border border-line rounded-lg p-8 text-center">
        <p className="text-xs text-ink-soft uppercase tracking-wide mb-1">
          Partagé par {doc.companies?.name ?? "une entreprise"}
        </p>
        <h1 className="font-display text-xl mb-1">{doc.name}</h1>
        <p className="text-sm text-ink-soft mb-6">
          {CATEGORY_LABELS[doc.category] ?? doc.category}
        </p>

        {signedUrl?.signedUrl ? (
          <a
            href={signedUrl.signedUrl}
            className="inline-block bg-ink text-white rounded-md px-5 py-2.5 text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            Télécharger le document
          </a>
        ) : (
          <p className="text-sm text-red-700">
            Le fichier est momentanément indisponible. Réessayez dans un instant.
          </p>
        )}
      </div>
    </main>
  );
}
