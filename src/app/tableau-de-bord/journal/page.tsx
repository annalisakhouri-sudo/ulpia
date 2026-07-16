export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";

const EVENT_LABELS: Record<string, string> = {
  document_deposited: "a déposé le document",
  document_deleted: "a supprimé le document",
  permission_granted: "a donné accès au document",
  permission_revoked: "a retiré l'accès au document",
  document_viewed: "a consulté le document",
  dossier_created: "a créé le dossier",
  dossier_deleted: "a supprimé le dossier",
  dossier_permission_granted: "a donné accès au dossier",
  dossier_permission_revoked: "a retiré l'accès au dossier",
  dossier_viewed: "a consulté le dossier",
  interlocutor_added: "a ajouté l'interlocuteur",
  demande_created: "a demandé un document",
  demande_acceptee: "a accepté une demande pour le document",
  demande_refusee: "a refusé une demande",
};

const EVENT_DOT_COLOR: Record<string, string> = {
  document_deposited: "bg-brass",
  document_deleted: "bg-red-500",
  permission_granted: "bg-brass",
  permission_revoked: "bg-red-500",
  document_viewed: "bg-emerald-500",
  dossier_created: "bg-brass",
  dossier_deleted: "bg-red-500",
  dossier_permission_granted: "bg-brass",
  dossier_permission_revoked: "bg-red-500",
  dossier_viewed: "bg-emerald-500",
  interlocutor_added: "bg-brass",
  demande_created: "bg-amber-500",
  demande_acceptee: "bg-emerald-500",
  demande_refusee: "bg-red-500",
};

type LogEntry = {
  id: string;
  event_type: string;
  actor: string;
  document_name: string | null;
  dossier_name: string | null;
  interlocutor_name: string | null;
  created_at: string;
};

function describeEvent(log: LogEntry) {
  const label = EVENT_LABELS[log.event_type] ?? log.event_type;
  const subject = log.document_name ?? log.dossier_name ?? log.interlocutor_name ?? "";
  return { label, subject };
}

export default async function JournalPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("access_logs")
    .select("id, event_type, actor, document_name, dossier_name, interlocutor_name, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl">Journal d&apos;accès</h1>
        <p className="text-sm text-ink-soft mt-1">
          L&apos;historique complet de ce qui se passe sur vos documents et dossiers.
        </p>
      </div>

      {!logs || logs.length === 0 ? (
        <div className="bg-surface border border-line border-dashed rounded-lg p-12 text-center">
          <p className="text-ink-soft text-sm">
            Aucune activité enregistrée pour l&apos;instant. Chaque dépôt, partage ou consultation
            apparaîtra ici.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-lg divide-y divide-line">
          {(logs as LogEntry[]).map((log) => {
            const { label, subject } = describeEvent(log);
            return (
              <div key={log.id} className="flex items-start gap-3 px-6 py-4">
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                    EVENT_DOT_COLOR[log.event_type] ?? "bg-ink-soft"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-ink">
                    <span className="font-medium">{log.actor}</span> {label}{" "}
                    {subject && <span className="font-medium">&quot;{subject}&quot;</span>}
                  </p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {new Date(log.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
