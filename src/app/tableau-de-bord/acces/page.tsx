export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { revokePermission, revokeDossierPermission } from "../actions";

export default async function AccesPage() {
  const supabase = await createClient();

  const { data: docPermissions } = await supabase
    .from("permissions")
    .select("id, created_at, documents(id, name), interlocutors(name, organization_type)")
    .order("created_at", { ascending: false });

  const { data: dossierPermissions } = await supabase
    .from("dossier_permissions")
    .select("id, created_at, dossiers(id, name), interlocutors(name, organization_type)")
    .order("created_at", { ascending: false });

  type Row = {
    id: string;
    kind: "document" | "dossier";
    subjectId: string;
    subjectName: string;
    interlocutorName: string;
    organizationType: string;
    createdAt: string;
  };

  const rows: Row[] = [
    ...(docPermissions ?? []).map((p) => {
      const doc = p.documents as unknown as { id: string; name: string } | null;
      const interlocutor = p.interlocutors as unknown as {
        name: string;
        organization_type: string;
      } | null;
      return {
        id: p.id,
        kind: "document" as const,
        subjectId: doc?.id ?? "",
        subjectName: doc?.name ?? "Document",
        interlocutorName: interlocutor?.name ?? "Interlocuteur",
        organizationType: interlocutor?.organization_type ?? "",
        createdAt: p.created_at,
      };
    }),
    ...(dossierPermissions ?? []).map((p) => {
      const dossier = p.dossiers as unknown as { id: string; name: string } | null;
      const interlocutor = p.interlocutors as unknown as {
        name: string;
        organization_type: string;
      } | null;
      return {
        id: p.id,
        kind: "dossier" as const,
        subjectId: dossier?.id ?? "",
        subjectName: dossier?.name ?? "Dossier",
        interlocutorName: interlocutor?.name ?? "Interlocuteur",
        organizationType: interlocutor?.organization_type ?? "",
        createdAt: p.created_at,
      };
    }),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl">Accès</h1>
        <p className="text-sm text-ink-soft mt-1">
          Qui a accès à quoi, pour quel document ou dossier, et depuis quand — en une seule vue.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-surface border border-line border-dashed rounded-lg p-12 text-center">
          <p className="text-ink-soft text-sm">Aucun accès accordé pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-lg divide-y divide-line">
          {rows.map((row) => {
            const revoke =
              row.kind === "document"
                ? revokePermission.bind(null, row.id, row.subjectId)
                : revokeDossierPermission.bind(null, row.id, row.subjectId);

            return (
              <div key={`${row.kind}-${row.id}`} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-sm text-ink">
                    <span className="font-medium">{row.interlocutorName}</span> a accès{" "}
                    {row.kind === "document" ? "au document" : "au dossier"}{" "}
                    <span className="font-medium">&quot;{row.subjectName}&quot;</span>
                  </p>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {row.organizationType} · depuis le{" "}
                    {new Date(row.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <form action={revoke}>
                  <button type="submit" className="text-xs text-red-700 hover:underline">
                    Retirer l&apos;accès
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
