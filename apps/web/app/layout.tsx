import type { Metadata } from "next";
import { PendingRetention } from "@/components/safety/pending-retention";

import "./globals.css";
import "@fontsource/quicksand/500.css";
import "@fontsource/quicksand/600.css";
import "@fontsource/quicksand/700.css";

export const metadata: Metadata = {
  title: "TalkyTown",
  description: "Child-friendly AI language learning with mock-first provider support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <PendingRetention />
        <a className="skip-link" href="#main-content">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
