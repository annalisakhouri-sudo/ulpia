"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  bilan: "Bilan comptable",
  kbis: "K-bis",
  attestation: "Attestation",
  autre: "Autre",
};

type Doc = {
  id: string;
  name: string;
  category: string;
  created_at: string;
  permissions: { id: string }[] | null;
};

export function DocumentsList({ documents }: { documents: Doc[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((doc) => {
      const categoryLabel = (CATEGORY_LABELS[doc.category] ?? doc.category).toLowerCase();
      return doc.name.toLowerCase().includes(q) || categoryLabel.includes(q);
    });
  }, [documents, query]);

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un document par nom ou type…"
          className="w-full max-w-sm rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
        />
      </div>

      {documents.length === 0 ? (
        <div className="bg-surface border border-line border-dashed rounded-lg p-12 text-center">
          <p className="text-ink-soft text-sm">
            Aucun document pour l&apos;instant. Déposez votre premier document pour commencer.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-line border-dashed rounded-lg p-12 text-center">
          <p className="text-ink-soft text-sm">Aucun document ne correspond à &quot;{query}&quot;.</p>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-lg divide-y divide-line">
          {filtered.map((doc) => (
            <Link
              key={doc.id}
              href={`/tableau-de-bord/documents/${doc.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-background/60 transition-colors"
            >
              <div>
                <p className="text-sm text-ink font-medium">{doc.name}</p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {CATEGORY_LABELS[doc.category] ?? doc.category} ·{" "}
                  {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <span className="text-xs text-brass bg-brass-soft rounded-full px-2.5 py-1 shrink-0">
                {doc.permissions?.length ?? 0} accès accordé
                {(doc.permissions?.length ?? 0) > 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
