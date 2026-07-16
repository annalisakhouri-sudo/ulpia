import { createServiceClient } from "@/lib/supabase/service";
import { DemandeForm } from "./demande-form";

export default async function DemandePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: interlocutor } = await supabase
    .from("interlocutors")
    .select("name, companies(name)")
    .eq("request_token", token)
    .single();

  if (!interlocutor) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <p className="font-display text-2xl mb-2">Lien invalide</p>
          <p className="text-sm text-ink-soft">
            Ce lien de demande n&apos;existe pas ou plus. Contactez l&apos;entreprise concernée
            pour obtenir un nouveau lien.
          </p>
        </div>
      </main>
    );
  }

  const companyName = (interlocutor.companies as unknown as { name: string } | null)?.name;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm bg-surface border border-line rounded-lg p-8">
        <p className="text-xs text-ink-soft uppercase tracking-wide mb-1 text-center">
          {companyName ?? "Entreprise"}
        </p>
        <h1 className="font-display text-xl mb-1 text-center">Faire une demande</h1>
        <p className="text-sm text-ink-soft mb-6 text-center">
          En tant que {interlocutor.name}, demandez un document — {companyName ?? "l'entreprise"}{" "}
          décidera de vous y donner accès ou non.
        </p>

        <DemandeForm token={token} />
      </div>
    </main>
  );
}
