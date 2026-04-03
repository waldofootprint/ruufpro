"use client";

// Live mini-preview of the roofer's site hero section.
// Updates in real-time as they type their business name, city, etc.
// Styled to match their chosen template.

type DesignStyle = "modern_clean" | "bold_confident" | "warm_trustworthy";

interface Props {
  designStyle: DesignStyle;
  businessName: string;
  city: string;
  state: string;
  phone: string;
  slug: string;
}

const THEME_STYLES: Record<DesignStyle, {
  bg: string; text: string; accent: string; muted: string;
  fontDisplay: string; fontBody: string; ctaBg: string; ctaText: string;
}> = {
  modern_clean: {
    bg: "#FFFFFF", text: "#0F172A", accent: "#1E3A5F", muted: "#64748b",
    fontDisplay: "'DM Serif Display', Georgia, serif", fontBody: "'DM Sans', system-ui, sans-serif",
    ctaBg: "#1E3A5F", ctaText: "#fff",
  },
  bold_confident: {
    bg: "#2A2D2A", text: "#E8E5D8", accent: "#F6C453", muted: "#9A9A8A",
    fontDisplay: "'Fredericka the Great', cursive", fontBody: "'Kalam', cursive",
    ctaBg: "#F6C453", ctaText: "#2A2D2A",
  },
  warm_trustworthy: {
    bg: "#F5F7FA", text: "#0F172A", accent: "#4A6FA5", muted: "#64748b",
    fontDisplay: "'Plus Jakarta Sans', system-ui, sans-serif", fontBody: "'Plus Jakarta Sans', system-ui, sans-serif",
    ctaBg: "#4A6FA5", ctaText: "#fff",
  },
};

export default function MiniPreview({ designStyle, businessName, city, state, phone, slug }: Props) {
  const t = THEME_STYLES[designStyle];
  const name = businessName || "Your Roofing Company";
  const loc = city && state ? `${city}, ${state}` : "Your City, ST";

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
      {/* Browser chrome */}
      <div style={{ background: "#f1f1f1", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          {slug || "your-business"}.ruufpro.com
        </div>
      </div>

      {/* Mini hero */}
      <div style={{ background: t.bg, padding: "32px 24px 28px" }}>
        {/* Nav bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <span style={{ fontFamily: t.fontDisplay, fontSize: 14, fontWeight: 700, color: t.text }}>{name}</span>
          <span style={{ fontSize: 11, color: t.muted }}>{phone || "(555) 123-4567"}</span>
        </div>

        {/* Urgency badge */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ display: "inline-block", fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: t.accent, background: `${t.accent}15`, padding: "3px 8px", borderRadius: 4 }}>
            Free Estimates Within 24 Hours
          </span>
        </div>

        {/* Headline */}
        <h2 style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 700, color: t.text, lineHeight: 1.15, marginBottom: 8 }}>
          Your Roof. Done Right.
        </h2>
        <p style={{ fontFamily: t.fontBody, fontSize: 11, color: t.muted, lineHeight: 1.5, marginBottom: 16, maxWidth: 280 }}>
          Trusted roofing in {loc}. Quality workmanship, transparent pricing, and a crew that shows up on time.
        </p>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ display: "inline-block", padding: "8px 16px", background: t.ctaBg, color: t.ctaText, fontSize: 11, fontWeight: 600, borderRadius: 20 }}>
            Get Free Estimate
          </span>
          <span style={{ display: "inline-block", padding: "8px 16px", border: `1px solid ${t.muted}40`, color: t.text, fontSize: 11, fontWeight: 600, borderRadius: 20 }}>
            Call {phone || "(555) 123-4567"}
          </span>
        </div>

        {/* Google badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 14 }}>
          <svg width="10" height="10" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.77-4.59l-7.98-6.19A23.9 23.9 0 000 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {[1,2,3,4,5].map(i => <svg key={i} width="8" height="8" viewBox="0 0 24 24" fill="#FBBC05" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
          <span style={{ fontSize: 9, color: t.muted }}>5-Star Google Rated</span>
        </div>
      </div>
    </div>
  );
}
