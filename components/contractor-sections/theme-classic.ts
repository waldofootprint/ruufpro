// Classic theme — clean, corporate, monochromatic.
// Inspired by premium roofing company sites with restrained color use.
// White backgrounds, charcoal text, uppercase headings, Inter font.

export const CLASSIC = {
  // Core colors — intentionally monochromatic
  bg: "#FFFFFF",
  bgAlt: "#F8F8F8",           // very subtle warm gray for alternating sections
  bgDark: "#1C1C1C",          // dark sections (CTA band, footer)
  text: "#1C1C1C",            // near-black for headings
  textSecondary: "#555555",   // body text
  textMuted: "#999999",       // captions, meta
  textOnDark: "#FFFFFF",      // text on dark backgrounds
  textOnDarkMuted: "rgba(255,255,255,0.6)",

  // Accent — charcoal for buttons, subtle steel for interactive
  accent: "#2D2D2D",          // primary buttons
  accentHover: "#111111",     // button hover
  accentLight: "#F0F0F0",     // light accent background
  border: "#E5E5E5",          // borders
  borderLight: "#F0F0F0",     // subtle dividers
  star: "#F59E0B",            // review stars

  // Typography — Inter for clean corporate feel
  fontDisplay: "var(--font-inter), 'Inter', sans-serif",
  fontBody: "var(--font-inter), 'Inter', sans-serif",

  // Spacing
  sectionPadding: "80px 24px",
  sectionPaddingMobile: "48px 16px",
  maxWidth: "1160px",
  borderRadius: "4px",        // sharper corners for corporate feel
  borderRadiusLg: "8px",
};
