"use client";

import { useState, useTransition } from "react";
import { grantDossierPermission, revokeDossierPermission } from "../../actions";

type Interlocutor = { id: string; name: string; organization_type: string };
type Permission = {
  id: string;
  access_token: string;
  interlocutors: { id: string; name: string; organization_type: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  banque: "Banque",
  notaire: "Notaire",
  avocat: "Avocat",
  assureur: "Assureur",
  autre: "Autre",
};

export function DossierPermissionManager({
  dossierId,
  interlocutors,
  permissions,
  siteUrl,
}: {
  dossierId: string;
  interlocutors: Interlocutor[];
  permissions: Permission[];
  siteUrl: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const grantedIds = new Set(permissions.map((p) => p.interlocutors?.id));
  const available = interlocutors.filter((i) => !grantedIds.has(i.id));

  function handleGrant() {
    if (!selected) return;
    startTransition(async () => {
      await grantDossierPermission(dossierId, selected);
      setSelected("");
    });
  }

  function handleRevoke(permissionId: string) {
    startTransition(async () => {
      await revokeDossierPermission(permissionId, dossierId);
    });
  }

  function copyLink(token: string, permissionId: string) {
    navigator.clipboard.writeText(`${siteUrl}/acces/dossier/${token}`);
    setCopiedId(permissionId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-6">
      <h2 className="font-display text-lg mb-4">Accès accordés à ce dossier</h2>
      <p className="text-xs text-ink-soft mb-4">
        Donner accès au dossier partage automatiquement tous les documents qu&apos;il contient,
        en un seul lien.
      </p>

      {permissions.length === 0 ? (
        <p className="text-sm text-ink-soft mb-4">
          Personne n&apos;a encore accès à ce dossier.
        </p>
      ) : (
        <ul className="divide-y divide-line mb-4">
          {permissions.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-ink">{p.interlocutors?.name}</p>
                <p className="text-xs text-ink-soft">
                  {TYPE_LABELS[p.interlocutors?.organization_type ?? "autre"]}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => copyLink(p.access_token, p.id)}
                  className="text-xs text-brass hover:underline"
                >
                  {copiedId === p.id ? "Lien copié !" : "Copier le lien d'accès"}
                </button>
                <button
                  onClick={() => handleRevoke(p.id)}
                  disabled={isPending}
                  className="text-xs text-red-700 hover:underline disabled:opacity-50"
                >
                  Retirer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 ? (
        <div className="flex gap-2 pt-2 border-t border-line">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 rounded-md border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brass"
          >
            <option value="">Choisir un interlocuteur…</option>
            {available.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({TYPE_LABELS[i.organization_type]})
              </option>
            ))}
          </select>
          <button
            onClick={handleGrant}
            disabled={!selected || isPending}
            className="bg-ink text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            Donner accès au dossier
          </button>
        </div>
      ) : (
        interlocutors.length === 0 && (
          <p className="text-xs text-ink-soft pt-2 border-t border-line">
            Ajoutez d&apos;abord un interlocuteur dans l&apos;onglet &quot;Interlocuteurs&quot;.
          </p>
        )
      )}
    </div>
  );
}
