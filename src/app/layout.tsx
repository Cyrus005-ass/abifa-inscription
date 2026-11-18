import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inscription — Hackathon ABIFA 2026",
  description: "Inscris-toi au Hackathon ABIFA 2026, en équipe ou sans équipe.",
  icons: { icon: "/image/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
