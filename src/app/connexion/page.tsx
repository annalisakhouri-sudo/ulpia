import Link from "next/link";
import { login } from "@/lib/auth-actions";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl tracking-tight text-ink">ULPIA</p>
          <p className="mt-1 text-sm text-ink-soft">
            Centralisez vos documents, partagez-les en confiance.
          </p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-8">
          <h1 className="font-display text-xl mb-6">Connexion</h1>

          {erreur && (
            <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {erreur}
            </p>
          )}

          <form action={login} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-ink-soft mb-1">
                Email professionnel
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-ink-soft mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-ink text-white rounded-md py-2 text-sm font-medium hover:bg-ink/90 transition-colors"
            >
              Se connecter
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-brass hover:underline">
            Créer votre espace entreprise
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-ink-soft">
          <Link href="/partenaire/connexion" className="hover:underline">
            Vous êtes un partenaire (banque, notaire…) ? Connectez-vous ici
          </Link>
        </p>
      </div>
    </main>
  );
}
