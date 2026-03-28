import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";

// Contractor template fonts — self-hosted by Next.js for performance.
// These are used on contractor sites (site/[slug] pages), not the marketing site.
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

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
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
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
