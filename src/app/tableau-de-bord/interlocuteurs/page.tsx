export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { AddInterlocutorForm } from "./add-interlocutor-form";
import { CopyRequestLink } from "./copy-request-link";

const TYPE_LABELS: Record<string, string> = {
  banque: "Banque",
  notaire: "Notaire",
  avocat: "Avocat",
  assureur: "Assureur",
  autre: "Autre",
};

export default async function InterlocuteursPage() {
  const supabase = await createClient();

  const { data: interlocutors } = await supabase
    .from("interlocutors")
    .select("id, name, email, organization_type, request_token, created_at")
    .order("created_at", { ascending: false });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl">Interlocuteurs</h1>
          <p className="text-sm text-ink-soft mt-1">
            Les banques, notaires, avocats et assureurs à qui vous partagez des documents.
          </p>
        </div>
        <AddInterlocutorForm />
      </div>

      {!interlocutors || interlocutors.length === 0 ? (
        <div className="bg-surface border border-line border-dashed rounded-lg p-12 text-center">
          <p className="text-ink-soft text-sm">Aucun interlocuteur pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-lg divide-y divide-line">
          {interlocutors.map((i) => (
            <div key={i.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm text-ink font-medium">{i.name}</p>
                <p className="text-xs text-ink-soft mt-0.5">{i.email || "Pas d'email renseigné"}</p>
                <div className="mt-1">
                  <CopyRequestLink token={i.request_token} siteUrl={siteUrl} />
                </div>
              </div>
              <span className="text-xs text-brass bg-brass-soft rounded-full px-2.5 py-1">
                {TYPE_LABELS[i.organization_type] ?? i.organization_type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
