import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ULPIA — Documents partagés en confiance",
  description:
    "Centralisez vos documents d'entreprise et partagez-les avec vos banques, notaires, avocats et assureurs, avec des accès maîtrisés.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
