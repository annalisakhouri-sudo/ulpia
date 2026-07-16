export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { DemandeActions } from "./demande-actions";

const CATEGORY_LABELS: Record<string, string> = {
  bilan: "Bilan comptable",
  kbis: "K-bis",
  attestation: "Attestation",
  autre: "Autre",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  en_attente: { label: "En attente", className: "bg-brass-soft text-brass" },
  acceptee: { label: "Acceptée", className: "bg-emerald-50 text-emerald-700" },
  refusee: { label: "Refusée", className: "bg-red-50 text-red-700" },
};

export default async function DemandesPage() {
  const supabase = await createClient();

  const { data: demandes } = await supabase
    .from("demandes")
    .select("id, category, message, status, created_at, interlocutors(name, organization_type)")
    .order("created_at", { ascending: false });

  const { data: allDocuments } = await supabase.from("documents").select("id, name, category");

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl">Demandes</h1>
        <p className="text-sm text-ink-soft mt-1">
          Les demandes de documents formulées par vos interlocuteurs. Vous décidez d&apos;accepter
          ou de refuser chacune.
        </p>
      </div>

      {!demandes || demandes.length === 0 ? (
        <div className="bg-surface border border-line border-dashed rounded-lg p-12 text-center">
          <p className="text-ink-soft text-sm">
            Aucune demande pour l&apos;instant. Partagez le lien de demande d&apos;un interlocuteur
            pour qu&apos;il puisse vous en envoyer une.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-lg divide-y divide-line">
          {demandes.map((d) => {
            const interlocutor = d.interlocutors as unknown as {
              name: string;
              organization_type: string;
            } | null;
            const status = STATUS_LABELS[d.status] ?? STATUS_LABELS.en_attente;
            const matchingDocuments = (allDocuments ?? []).filter((doc) => doc.category === d.category);

            return (
              <div key={d.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-ink">
                      <span className="font-medium">{interlocutor?.name ?? "Interlocuteur"}</span>{" "}
                      demande un document
                    </p>
                    <p className="text-xs text-ink-soft mt-0.5">
                      {CATEGORY_LABELS[d.category] ?? d.category} ·{" "}
                      {new Date(d.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    {d.message && (
                      <p className="text-xs text-ink-soft mt-1 italic">&quot;{d.message}&quot;</p>
                    )}
                  </div>
                  <span className={`text-xs rounded-full px-2.5 py-1 shrink-0 ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                {d.status === "en_attente" && (
                  <DemandeActions demandeId={d.id} matchingDocuments={matchingDocuments} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
