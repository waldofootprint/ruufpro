"use client";

// Hero section editor — lets roofers customize their headline, subtitle, and CTA text.
// All fields come pre-filled with smart defaults.
//
// ── DESIGN NOTE: "Backed by Research" Indicators ──────────────────────────
// Every editable field in the roofer-facing editor (here AND in /dashboard/my-site)
// should show a small trust badge or "Backed by research" indicator next to the
// help text, so roofers understand that our defaults and placeholders aren't
// arbitrary — they're optimized based on real conversion data.
//
// Implementation plan:
// - Add a small badge (e.g. 🔬 "Optimized by research" or a beaker/flask icon)
//   next to each field's help text
// - On hover/tap, show a tooltip with the specific research insight:
//     Headline:   "Benefit-first headlines convert 35%+ better than generic ones (Q2, Q3)"
//     Subtitle:   "Including city name + trust signals increases local conversions (Q1, Q3)"
//     CTA text:   "First-person CTAs ('Get My...') outperform second-person ('Get Your...') (Q2, Q3)"
//     Phone:      "Phone # above fold = 2% conversion lift. 67% prefer to call. (Q3, Q4)"
//     Services:   "1 page per service type = highest SEO click growth (Q2)"
//     Reviews:    "50+ reviews = 4.6x conversion rate vs zero reviews (Q3)"
//     About:      "Real team photos beat stock by 35% — upload yours (Q3)"
//     Trust badges: "Trust badges near CTAs = 87% more leads (Q3)"
//     City pages: "Dedicated city pages = highest-ROI SEO tactic for roofers (Q2)"
//
// This applies to BOTH:
//   1. /components/onboarding/hero-editor.tsx (this file — onboarding flow)
//   2. /app/dashboard/my-site/page.tsx (post-onboarding editor)
//
// Full research source: Notion → Knowledge Vault → "Website Research — Complete Findings by Topic"
// ──────────────────────────────────────────────────────────────────────────

interface Props {
  headline: string;
  onHeadlineChange: (v: string) => void;
  subtitle: string;
  onSubtitleChange: (v: string) => void;
  ctaText: string;
  onCtaTextChange: (v: string) => void;
  city?: string;
}

export default function HeroEditor({
  headline, onHeadlineChange,
  subtitle, onSubtitleChange,
  ctaText, onCtaTextChange,
  city,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <label style={{ display: "block" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Headline</span>
        <input
          type="text"
          value={headline}
          onChange={(e) => onHeadlineChange(e.target.value)}
          style={{
            marginTop: 4, display: "block", width: "100%", padding: "10px 14px",
            border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14,
            color: "#111827", outline: "none",
          }}
          placeholder="Your Roof. Done Right. Guaranteed."
        />
        <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4 }}>Research-backed</span>
          Benefit-first headlines convert 35%+ better than generic ones
        </span>
      </label>

      <label style={{ display: "block" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Subtitle</span>
        <textarea
          value={subtitle}
          onChange={(e) => onSubtitleChange(e.target.value)}
          rows={2}
          style={{
            marginTop: 4, display: "block", width: "100%", padding: "10px 14px",
            border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14,
            color: "#111827", outline: "none", resize: "vertical",
          }}
          placeholder={city ? `${city}'s Licensed & Insured Roofer · 25-Year Warranty · Free Estimates` : "Licensed & Insured Roofer · 25-Year Warranty · Free Estimates"}
        />
        <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4 }}>Research-backed</span>
          Including your city name increases local conversions
        </span>
      </label>

      <label style={{ display: "block" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Button Text</span>
        <input
          type="text"
          value={ctaText}
          onChange={(e) => onCtaTextChange(e.target.value)}
          style={{
            marginTop: 4, display: "block", width: "100%", padding: "10px 14px",
            border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14,
            color: "#111827", outline: "none",
          }}
          placeholder="Get My Free Estimate"
        />
        <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ background: "#EFF6FF", color: "#2563EB", fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4 }}>Research-backed</span>
          First-person CTAs (&quot;Get My...&quot;) outperform &quot;Get Your...&quot;
        </span>
      </label>
    </div>
  );
}
