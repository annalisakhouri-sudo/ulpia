"use client";

import { useRef, useState, useTransition } from "react";
import { createDossier } from "../actions";

export function CreateDossierForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createDossier(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-ink text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-ink/90 transition-colors"
      >
        + Nouveau dossier
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="bg-surface border border-line rounded-lg p-6 mb-6 space-y-4"
    >
      <h3 className="font-display text-lg">Nouveau dossier</h3>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm text-ink-soft mb-1">Nom du dossier</label>
        <input
          type="text"
          name="name"
          required
          placeholder="ex : Dossier financement Résidence Les Tilleuls"
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        />
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-1">
          Documents attendus (optionnel)
        </label>
        <input
          type="text"
          name="requiredCategories"
          placeholder="ex : Bilan comptable, K-bis, Attestation"
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        />
        <p className="text-xs text-ink-soft mt-1">
          Séparez les types par une virgule. Le dossier indiquera ce qui manque encore.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-ink text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Création…" : "Créer"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-ink-soft hover:text-ink"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
