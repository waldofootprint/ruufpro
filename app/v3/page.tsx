import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/components/ridgeline-v3/_tokens.css";

import { HeroStage } from "@/components/ridgeline-v3/hero";
import { MetaStrip } from "@/components/ridgeline-v3/marquee";
import { GoogleUpdate } from "@/components/ridgeline-v3/google-update";
import { Toolkit } from "@/components/ridgeline-v3/toolkit";
import { MarketingEverywhere } from "@/components/ridgeline-v3/marketing-everywhere";
import { MissedCall } from "@/components/ridgeline-v3/missed-call";
import { Pricing } from "@/components/ridgeline-v3/pricing";
import { NoteFAQ } from "@/components/ridgeline-v3/note-faq";
import { Footer } from "@/components/ridgeline-v3/footer";

export const metadata = {
  title: "RuufPro v3 — preview",
  robots: { index: false, follow: false },
};

export default function V3Preview() {
  return (
    <div className={`rv3 ${GeistSans.variable} ${GeistMono.variable}`}>
      <HeroStage />
      <MetaStrip />
      <GoogleUpdate />
      <Toolkit />
      <MarketingEverywhere />
      <MissedCall />
      <Pricing />
      <NoteFAQ />
      <Footer />
    </div>
  );
}
