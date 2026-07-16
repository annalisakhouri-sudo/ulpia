export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PermissionManager } from "./permission-manager";
import { ExpiryEditor } from "./expiry-editor";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: document } = await supabase
    .from("documents")
    .select("id, name, category, created_at, storage_path, expires_at")
    .eq("id", id)
    .single();

  if (!document) notFound();

  const { data: interlocutors } = await supabase
    .from("interlocutors")
    .select("id, name, organization_type")
    .order("name");

  const { data: permissions } = await supabase
    .from("permissions")
    .select("id, access_token, interlocutors(id, name, organization_type)")
    .eq("document_id", id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl">{document.name}</h1>
      <p className="text-sm text-ink-soft mt-1 mb-8">
        Ajouté le {new Date(document.created_at).toLocaleDateString("fr-FR")}
      </p>

      <ExpiryEditor documentId={document.id} currentExpiresAt={document.expires_at} />

      <PermissionManager
        documentId={document.id}
        interlocutors={interlocutors ?? []}
        permissions={
          (permissions ?? []) as unknown as {
            id: string;
            access_token: string;
            interlocutors: { id: string; name: string; organization_type: string } | null;
          }[]
        }
        siteUrl={siteUrl}
      />
    </div>
  );
}
