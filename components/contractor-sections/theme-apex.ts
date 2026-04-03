// Apex theme — Soft Structuralism archetype.
// Silver-grey backgrounds, massive bold Grotesk typography,
// floating components with ultra-soft ambient shadows.
// Inspired by Linear, Vercel, and $150K agency builds.

export const APEX = {
  // Core colors — no pure black, no pure white
  bg: "#F4F4F5",           // zinc-100 silver-grey
  bgWhite: "#FAFAFA",      // warm white for cards
  bgAlt: "#EBEBED",        // subtle contrast sections
  bgDark: "#18181B",       // zinc-900 for contrast sections
  text: "#18181B",         // zinc-900 — never pure black
  textSecondary: "#52525B", // zinc-600
  textMuted: "#A1A1AA",    // zinc-400
  accent: "#2563EB",       // blue-600 — singular, desaturated
  accentHover: "#1D4ED8",  // blue-700
  accentLight: "#EFF6FF",  // blue-50
  border: "#E4E4E7",       // zinc-200
  borderLight: "#F4F4F5",  // zinc-100
  star: "#EAB308",         // yellow-500
  cardBg: "#FFFFFF",       // pure white cards on grey bg
  cardShadow: "0 20px 40px -15px rgba(0,0,0,0.06)", // diffused ambient shadow
  cardShadowHover: "0 25px 50px -12px rgba(0,0,0,0.1)",

  // Typography — Outfit: geometric, modern, premium (NOT Inter)
  fontDisplay: "var(--font-outfit), 'Outfit', sans-serif",
  fontBody: "var(--font-outfit), 'Outfit', sans-serif",

  // Spacing — generous, the layout breathes
  sectionPadding: "96px 32px",  // py-24
  maxWidth: "1200px",
  borderRadius: "20px",     // rounded-[20px] — large squircle
  borderRadiusLg: "24px",   // rounded-3xl for cards
  borderRadiusFull: "9999px", // pills

  // Motion — custom cubic bezier, no linear/ease-in-out
  transition: "all 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
  transitionFast: "all 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
};
