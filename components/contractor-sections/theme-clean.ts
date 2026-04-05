// Clean theme (née Blueprint) — bright, approachable, trust-forward.
// Pure white + warm gray + coral CTAs + blue accents.
// Feels like a company you'd invite into your home. Trust signals are MASSIVE.
// Plus Jakarta Sans for friendly, professional typography.

export const CLEAN = {
  // Core colors — warm, not cold
  bg: "#FFFFFF",
  bgWarm: "#F5F5F0",             // warm light gray — NOT cold blue-gray
  bgAlt: "#FAFAF7",              // subtle warm alternating
  bgCard: "#FFFFFF",             // white cards on warm bg
  text: "#334155",               // dark slate — softer than black
  textSecondary: "#64748B",      // body text
  textMuted: "#94A3B8",          // captions, meta
  textOnDark: "#FFFFFF",

  // Accent — confident blue for links and secondary
  accent: "#2563EB",             // blue-600
  accentHover: "#1D4ED8",        // blue-700
  accentLight: "#EFF6FF",        // blue-50 for backgrounds
  accentSubtle: "rgba(37,99,235,0.06)",

  // CTA — warm coral/red for primary buttons
  cta: "#DC4A3F",                // warm coral-red
  ctaHover: "#C73E33",
  ctaText: "#FFFFFF",

  // Trust green — for checkmarks and verified badges
  trustGreen: "#16A34A",
  trustGreenBg: "rgba(22,163,74,0.08)",

  // Borders
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  borderDashed: "#D1D5DB",

  // Stars
  star: "#EAB308",               // warm yellow

  // Typography — Plus Jakarta Sans
  fontDisplay: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
  fontBody: "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",

  // Spacing — clean, organized
  sectionPadding: "72px 32px",
  sectionPaddingMobile: "48px 20px",
  maxWidth: "1100px",
  borderRadius: "14px",          // friendly rounded corners
  borderRadiusLg: "18px",
  borderRadiusFull: "9999px",    // pills

  // Shadows — soft, approachable
  cardShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)",
  cardShadowHover: "0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)",

  // Motion
  transition: "all 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
};

// Keep backward compat alias
export const BLUEPRINT = CLEAN;
