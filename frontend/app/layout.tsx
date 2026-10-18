import type { Metadata, Viewport } from "next";
import Shell from "@/components/Shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fake_News_Detector — Détection de fake news arabes",
  description: "Interface d'analyse basée sur XLM-RoBERTa et AraBERT fine-tunés",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
