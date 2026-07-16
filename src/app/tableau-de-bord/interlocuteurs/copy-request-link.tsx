"use client";

import { useState } from "react";

export function CopyRequestLink({ token, siteUrl }: { token: string; siteUrl: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(`${siteUrl}/demande/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={copy} className="text-xs text-brass hover:underline">
      {copied ? "Lien copié !" : "Copier le lien de demande"}
    </button>
  );
}
