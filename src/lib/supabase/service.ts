import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ATTENTION : ce client utilise la clé secrète (service role) et contourne les
// permissions (RLS). Il ne doit JAMAIS être importé dans un composant "use client"
// ni exposé au navigateur — uniquement utilisé dans du code qui s'exécute sur le serveur,
// comme la page de lien d'accès public (/acces/[token]).
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
