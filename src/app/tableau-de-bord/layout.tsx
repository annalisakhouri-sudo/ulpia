import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/auth-actions";

export default async function TableauDeBordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, companies(name)")
    .eq("id", user.id)
    .single();

  const companyName = (profile?.companies as unknown as { name: string } | null)?.name;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/tableau-de-bord" className="font-display text-lg text-ink">
              ULPIA
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/tableau-de-bord" className="text-ink-soft hover:text-ink transition-colors">
                Documents
              </Link>
              <Link
                href="/tableau-de-bord/dossiers"
                className="text-ink-soft hover:text-ink transition-colors"
              >
                Dossiers
              </Link>
              <Link
                href="/tableau-de-bord/acces"
                className="text-ink-soft hover:text-ink transition-colors"
              >
                Accès
              </Link>
              <Link
                href="/tableau-de-bord/interlocuteurs"
                className="text-ink-soft hover:text-ink transition-colors"
              >
                Interlocuteurs
              </Link>
              <Link
                href="/tableau-de-bord/demandes"
                className="text-ink-soft hover:text-ink transition-colors"
              >
                Demandes
              </Link>
              <Link
                href="/tableau-de-bord/journal"
                className="text-ink-soft hover:text-ink transition-colors"
              >
                Journal
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="text-ink">{companyName ?? "Votre entreprise"}</p>
              <p className="text-ink-soft text-xs">{profile?.full_name ?? user.email}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-ink-soft hover:text-ink border border-line rounded-md px-3 py-1.5 transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
    </div>
  );
}
