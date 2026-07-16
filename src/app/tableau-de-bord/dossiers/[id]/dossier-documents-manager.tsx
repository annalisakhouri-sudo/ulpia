"use client";

import { useState, useTransition } from "react";
import { addDocumentToDossier, removeDocumentFromDossier } from "../../actions";

type DocItem = { id: string; name: string; category: string };

const CATEGORY_LABELS: Record<string, string> = {
  bilan: "Bilan comptable",
  kbis: "K-bis",
  attestation: "Attestation",
  autre: "Autre",
};

export function DossierDocumentsManager({
  dossierId,
  documentsInDossier,
  availableDocuments,
}: {
  dossierId: string;
  documentsInDossier: DocItem[];
  availableDocuments: DocItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");

  function handleAdd() {
    if (!selected) return;
    startTransition(async () => {
      await addDocumentToDossier(dossierId, selected);
      setSelected("");
    });
  }

  function handleRemove(documentId: string) {
    startTransition(async () => {
      await removeDocumentFromDossier(dossierId, documentId);
    });
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-6 mb-6">
      <h2 className="font-display text-lg mb-4">Documents dans ce dossier</h2>

      {documentsInDossier.length === 0 ? (
        <p className="text-sm text-ink-soft mb-4">Aucun document dans ce dossier pour l&apos;instant.</p>
      ) : (
        <ul className="divide-y divide-line mb-4">
          {documentsInDossier.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-ink">{doc.name}</p>
                <p className="text-xs text-ink-soft">
                  {CATEGORY_LABELS[doc.category] ?? doc.category}
                </p>
              </div>
              <button
                onClick={() => handleRemove(doc.id)}
                disabled={isPending}
                className="text-xs text-red-700 hover:underline disabled:opacity-50"
              >
                Retirer du dossier
              </button>
            </li>
          ))}
        </ul>
      )}

      {availableDocuments.length > 0 ? (
        <div className="flex gap-2 pt-2 border-t border-line">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
          >
            <option value="">Choisir un document existant…</option>
            {availableDocuments.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!selected || isPending}
            className="bg-ink text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            Ajouter au dossier
          </button>
        </div>
      ) : (
        <p className="text-xs text-ink-soft pt-2 border-t border-line">
          Tous vos documents sont déjà dans ce dossier, ou vous n&apos;avez pas encore déposé de
          document.
        </p>
      )}
    </div>
  );
}
