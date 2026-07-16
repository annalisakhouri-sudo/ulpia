"use client";

import { useRef, useState, useTransition } from "react";
import { uploadDocument } from "./actions";

const CATEGORY_SUGGESTIONS = [
  "Bilan comptable",
  "K-bis",
  "Attestation",
  "Devis",
  "Contrat",
  "Facture",
  "Statuts",
  "Pièce d'identité",
];

export function UploadForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await uploadDocument(formData);
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
        + Déposer un document
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="bg-surface border border-line rounded-lg p-6 mb-6 space-y-4"
    >
      <h3 className="font-display text-lg">Déposer un document</h3>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm text-ink-soft mb-1">Fichier</label>
        <input
          type="file"
          name="file"
          required
          className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brass-soft file:text-ink file:px-3 file:py-1.5 file:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-1">Nom du document</label>
        <input
          type="text"
          name="name"
          placeholder="ex : Bilan 2025"
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        />
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-1">Catégorie</label>
        <input
          type="text"
          name="category"
          list="category-suggestions"
          placeholder="ex : Bilan comptable"
          defaultValue="Autre"
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        />
        <datalist id="category-suggestions">
          {CATEGORY_SUGGESTIONS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="block text-sm text-ink-soft mb-1">
          Date de renouvellement (optionnel)
        </label>
        <input
          type="date"
          name="expiresAt"
          className="w-full rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        />
        <p className="text-xs text-ink-soft mt-1">
          Si ce document doit être renouvelé (attestation, K-bis…), indiquez une date : vous serez
          prévenu(e) 30 jours avant.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-ink text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Envoi en cours…" : "Envoyer"}
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
