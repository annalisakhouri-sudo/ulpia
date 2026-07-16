import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase utilisé côté serveur (Server Components, Server Actions, routes API)
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Peut être appelé depuis un Server Component : sans effet, le middleware gère le refresh de session.
          }
        },
      },
      global: {
        // Empêche Next.js de mettre en cache les réponses de l'API Supabase — sans ça, un
        // ancien résultat (ex: "aucun document") peut rester servi après changement de compte.
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );
}
