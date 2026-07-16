"use client";

import { useState, useTransition } from "react";
import { submitDemande } from "./actions";

const CATEGORIES = [
  { value: "bilan", label: "Bilan comptable" },
  { value: "kbis", label: "K-bis" },
  { value: "attestation", label: "Attestation" },
  { value: "autre", label: "Autre" },
];

export function DemandeForm({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitDemande(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setDone(true);
      }
    });
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-ink">
          Votre demande a bien été envoyée. Vous serez prévenu(e) une fois qu&apos;elle aura été
          traitée.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm text-ink-soft mb-1">Type de document demandé</label>
        <select
          name="category"
          required
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-1">Message (optionnel)</label>
        <textarea
          name="message"
          rows={3}
          placeholder="Précisez le contexte de votre demande si besoin…"
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-ink text-white rounded-md py-2.5 text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Envoi en cours…" : "Envoyer la demande"}
      </button>
    </form>
  );
}
