"use client";

import { useState, useTransition } from "react";
import { acceptDemande, refuseDemande } from "../actions";

type DocOption = { id: string; name: string };

export function DemandeActions({
  demandeId,
  matchingDocuments,
}: {
  demandeId: string;
  matchingDocuments: DocOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedDoc, setSelectedDoc] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAccept() {
    if (!selectedDoc) return;
    setError(null);
    startTransition(async () => {
      const result = await acceptDemande(demandeId, selectedDoc);
      if (result?.error) setError(result.error);
    });
  }

  function handleRefuse() {
    startTransition(async () => {
      await refuseDemande(demandeId);
    });
  }

  return (
    <div className="mt-3 space-y-2">
      {error && <p className="text-xs text-red-700">{error}</p>}

      {matchingDocuments.length > 0 ? (
        <div className="flex gap-2">
          <select
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
            className="flex-1 rounded-md border border-line px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brass"
          >
            <option value="">Choisir le document à transmettre…</option>
            {matchingDocuments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAccept}
            disabled={!selectedDoc || isPending}
            className="text-xs bg-ink text-white rounded-md px-3 py-1.5 font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            Accepter
          </button>
          <button
            onClick={handleRefuse}
            disabled={isPending}
            className="text-xs text-red-700 hover:underline disabled:opacity-50"
          >
            Refuser
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <p className="text-xs text-ink-soft">
            Aucun document de ce type n&apos;est encore déposé.
          </p>
          <button
            onClick={handleRefuse}
            disabled={isPending}
            className="text-xs text-red-700 hover:underline disabled:opacity-50"
          >
            Refuser
          </button>
        </div>
      )}
    </div>
  );
}
