"use client";

import { useState, useTransition } from "react";
import { submitPartnerDemande } from "./actions";

export function NewDemandeForm({ interlocutorId }: { interlocutorId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitPartnerDemande(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setDone(true);
        setTimeout(() => {
          setDone(false);
          setOpen(false);
        }, 1500);
      }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-brass hover:underline">
        + Demander un document
      </button>
    );
  }

  if (done) {
    return <p className="text-xs text-emerald-700">Demande envoyée !</p>;
  }

  return (
    <form action={handleSubmit} className="mt-2 space-y-2 bg-background rounded-md p-3">
      <input type="hidden" name="interlocutorId" value={interlocutorId} />

      {error && <p className="text-xs text-red-700">{error}</p>}

      <input
        type="text"
        name="category"
        required
        placeholder="Type de document (ex : K-bis)"
        className="w-full rounded-md border border-line px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brass"
      />
      <textarea
        name="message"
        rows={2}
        placeholder="Message (optionnel)"
        className="w-full rounded-md border border-line px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brass"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="text-xs bg-ink text-white rounded-md px-3 py-1.5 font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Envoi…" : "Envoyer"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-soft hover:text-ink"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
