// Bold theme (née Chalkboard) — dark, confident, industrial-premium.
// Rich charcoal + warm gold accent + orange CTAs.
// Feels like a high-end contractor's showroom. Stands out because most roofing sites are white.
// Plus Jakarta Sans for sharp, polished typography.

export const BOLD = {
  // Core colors — rich charcoal, NOT green
  bg: "#141414",
  bgLight: "#1E1E1E",
  bgAlt: "#1A1A1A",              // alternating section background
  bgCard: "#1E1E1E",             // card backgrounds
  text: "#F0F0F0",               // off-white primary
  textSecondary: "#B0B0B0",      // muted body
  textMuted: "#777777",          // captions, meta
  textFaint: "rgba(240,240,240,0.25)",

  // Accent — warm gold, NOT yellow-chalk
  accent: "#D4A843",             // premium gold
  accentHover: "#C49A38",        // gold hover
  accentSubtle: "rgba(212,168,67,0.10)",
  accentGlow: "rgba(212,168,67,0.15)", // card hover glow

  // CTA — bright warm orange on dark backgrounds
  cta: "#E67E22",
  ctaHover: "#D97218",
  ctaText: "#FFFFFF",

  // Borders
  border: "rgba(240,240,240,0.08)",
  borderAccent: "rgba(212,168,67,0.25)", // gold borders for trust badges
  borderDashed: "rgba(240,240,240,0.15)",

  // Stars
  star: "#D4A843",               // gold stars match accent

  // Typography — Plus Jakarta Sans for everything
  fontDisplay: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
  fontBody: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",

  // Spacing — generous, architectural feel
  sectionPadding: "80px 32px",
  sectionPaddingMobile: "56px 20px",
  maxWidth: "1100px",
  borderRadius: "12px",
  borderRadiusLg: "16px",

  // Motion
  transition: "all 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
};

// Keep backward compat alias
export const CHALK = BOLD;
