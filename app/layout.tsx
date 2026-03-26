import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RoofReady — Free Roofing Websites + Instant Estimates",
  description:
    "Get a professional roofing website in minutes. Free. Add an instant estimate widget for $99/mo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
