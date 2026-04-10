import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base64 Utility",
  description: "Encode and decode text with a small deployable Next.js app.",
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
