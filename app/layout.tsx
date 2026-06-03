import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naltech CCTV Cloud",
  description: "Platform cloud recording CCTV untuk bisnis, rumah, dan operasional pelanggan."
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
