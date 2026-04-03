import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans, Sora, Plus_Jakarta_Sans, Inter, Outfit } from "next/font/google";

// Contractor template fonts — self-hosted by Next.js for performance.
// Modern Clean: DM Sans (body) + Sora (headings)
// Chalkboard: Plus Jakarta Sans (headlines + body)
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RuufPro — Free Roofing Websites + Instant Estimates",
  description:
    "Get a professional roofing website in minutes. Free. Upgrade to Pro for $149/mo to turn visitors into leads.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${sora.variable} ${plusJakarta.variable} ${inter.variable} ${outfit.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RuufPro" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
