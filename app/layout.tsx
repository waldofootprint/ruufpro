import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RoofReady — Free Roofing Websites + Instant Estimates",
  description:
    "Get a professional roofing website in minutes. Free. Add an instant estimate widget for $99/mo.",
  manifest: "/manifest.json",
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RoofReady" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
