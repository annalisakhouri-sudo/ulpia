"use client";

import { useState, useTransition } from "react";
import { updateDocumentExpiry } from "../../actions";

export function ExpiryEditor({
  documentId,
  currentExpiresAt,
}: {
  documentId: string;
  currentExpiresAt: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(currentExpiresAt ? currentExpiresAt.slice(0, 10) : "");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateDocumentExpiry(documentId, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-6 mb-6">
      <h2 className="font-display text-lg mb-1">Date de renouvellement</h2>
      <p className="text-xs text-ink-soft mb-3">
        Optionnel. Vous serez prévenu(e) dans l&apos;application 30 jours avant cette date.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-ink text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {saved && <span className="text-xs text-emerald-700">Enregistré</span>}
      </div>
    </div>
  );
}
