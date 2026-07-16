export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { UploadForm } from "./upload-form";
import { DocumentsList } from "./documents-list";

export default async function TableauDeBordPage() {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, category, created_at, expires_at, permissions(id)")
    .order("created_at", { ascending: false });

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const alerts = (documents ?? [])
    .filter((d) => d.expires_at)
    .map((d) => ({
      id: d.id,
      name: d.name,
      expiresAt: new Date(d.expires_at as string),
    }))
    .filter((d) => d.expiresAt <= in30Days)
    .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Documents</h1>
          <p className="text-sm text-ink-soft mt-1">
            Déposez vos documents une fois, partagez-les avec qui vous voulez.
          </p>
        </div>
        <UploadForm />
      </div>

      {alerts.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-900 mb-2">
            {alerts.length} document{alerts.length > 1 ? "s" : ""} à renouveler bientôt
          </p>
          <ul className="space-y-1">
            {alerts.map((a) => {
              const isExpired = a.expiresAt < now;
              return (
                <li key={a.id} className="text-xs text-amber-800">
                  <a href={`/tableau-de-bord/documents/${a.id}`} className="underline">
                    {a.name}
                  </a>{" "}
                  —{" "}
                  {isExpired
                    ? `expiré depuis le ${a.expiresAt.toLocaleDateString("fr-FR")}`
                    : `à renouveler avant le ${a.expiresAt.toLocaleDateString("fr-FR")}`}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <DocumentsList documents={documents ?? []} />
    </div>
  );
}
