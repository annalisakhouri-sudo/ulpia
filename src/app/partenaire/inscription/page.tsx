import Link from "next/link";
import { partnerSignup } from "@/lib/partner-auth-actions";

export default async function PartenaireInscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl tracking-tight text-ink">ULPIA</p>
          <p className="mt-1 text-sm text-ink-soft">Espace partenaire</p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-8">
          <h1 className="font-display text-xl mb-2">Créer votre compte partenaire</h1>
          <p className="text-xs text-ink-soft mb-6">
            Utilisez le même email que celui avec lequel les entreprises vous ont ajouté(e) comme
            interlocuteur — c&apos;est ce qui permet de retrouver automatiquement vos accès.
          </p>

          {erreur && (
            <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {erreur}
            </p>
          )}

          <form action={partnerSignup} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm text-ink-soft mb-1">
                Votre nom
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm text-ink-soft mb-1">
                Email
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
                minLength={6}
                className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-ink text-white rounded-md py-2 text-sm font-medium hover:bg-ink/90 transition-colors"
            >
              Créer mon compte
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Déjà un compte ?{" "}
          <Link href="/partenaire/connexion" className="text-brass hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
