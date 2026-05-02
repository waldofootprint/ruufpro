import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/components/ridgeline-v3/_tokens.css";
import { Pricing } from "@/components/ridgeline-v3/pricing";
import { MissedCall } from "@/components/ridgeline-v3/missed-call";
import { Footer } from "@/components/ridgeline-v3/footer";

export const metadata = {
  title: "RuufPro v3 — preview",
  robots: { index: false, follow: false },
};

export default function V3Preview() {
  return (
    <div className={`rv3 ${GeistSans.variable} ${GeistMono.variable}`}>
      <div
        style={{
          padding: "16px 36px",
          fontFamily: "var(--font-geist-mono, monospace)",
          fontSize: 11,
          color: "var(--rv3-slate-2)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          borderBottom: "1px solid var(--rv3-line)",
          background: "var(--rv3-bg-3)",
        }}
      >
        ridgeline-v3 · preview · not indexed · sections shipping one-by-one
      </div>

      <MissedCall />
      <Pricing />
      <Footer />
    </div>
  );
}
