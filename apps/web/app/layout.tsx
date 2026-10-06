import type { Metadata } from "next";

import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
