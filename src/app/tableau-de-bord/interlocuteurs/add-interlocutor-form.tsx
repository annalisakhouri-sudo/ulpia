"use client";

import { useRef, useState, useTransition } from "react";
import { addInterlocutor } from "../actions";

export function AddInterlocutorForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addInterlocutor(formData);
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
        + Ajouter un interlocuteur
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="bg-surface border border-line rounded-lg p-6 mb-6 space-y-4"
    >
      <h3 className="font-display text-lg">Ajouter un interlocuteur</h3>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm text-ink-soft mb-1">Nom</label>
        <input
          type="text"
          name="name"
          required
          placeholder="ex : Crédit Agricole - M. Dupont"
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        />
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-1">Email (optionnel)</label>
        <input
          type="email"
          name="email"
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        />
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-1">Type</label>
        <input
          type="text"
          name="organizationType"
          list="organization-type-suggestions"
          placeholder="ex : Banque, Client, Fournisseur…"
          defaultValue="Autre"
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        />
        <datalist id="organization-type-suggestions">
          <option value="Banque" />
          <option value="Notaire" />
          <option value="Avocat" />
          <option value="Assureur" />
          <option value="Client" />
          <option value="Fournisseur" />
          <option value="Partenaire" />
        </datalist>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-ink text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Ajout en cours…" : "Ajouter"}
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
