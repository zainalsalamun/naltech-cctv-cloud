import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naltech CCTV Cloud",
  description: "Demo platform cloud recording CCTV untuk investor."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
