import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans, Sora, Plus_Jakarta_Sans, Inter, Outfit, Lora, Roboto_Slab, Barlow, Barlow_Condensed } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import CookieBanner from "@/components/cookie-banner";
import { cn } from "@/lib/utils";


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

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-roboto-slab",
  display: "swap",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow-condensed",
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
    <html lang="en" className={cn(dmSans.variable, sora.variable, plusJakarta.variable, inter.variable, outfit.variable, lora.variable, robotoSlab.variable, barlow.variable, barlowCondensed.variable, "font-sans", GeistSans.variable)}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RuufPro" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
