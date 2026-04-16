// Modern Clean theme — color tokens and shared values.
// Matches the approved HTML prototype palette.
// These are used as inline styles since the template needs to
// work as an embedded site without polluting the host's CSS.

export const THEME = {
  // Core colors — Dark Iron + Amber Gold (Option C1)
  primary: "#1A1A1A",        // dark iron
  primarySoft: "#2A2A2A",    // slightly lighter iron
  accent: "#D4880F",         // amber gold
  accentHover: "#B8760D",    // darker amber
  bgWarm: "#ECEAE6",         // warm stone
  bgWhite: "#FFFFFF",
  bg: "#F5F3F0",             // warm off-white page bg
  textPrimary: "#1A1A1A",    // pure dark
  textSecondary: "#71706C",  // warm muted
  textMuted: "#8A8884",      // lighter muted
  border: "#DEDBD6",         // warm border
  ctaBg: "#D4880F",          // amber gold CTA
  star: "#D4880F",           // gold stars (matches accent)
  success: "#5A7A3A",        // olive green

  // Typography — Barlow Condensed (display) + Barlow (body)
  fontDisplay: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
  fontSerif: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif",
  fontBody: "var(--font-barlow), 'Barlow', sans-serif",

  // Spacing
  sectionPadding: "80px 24px",
  sectionPaddingMobile: "48px 16px",
  maxWidth: "1140px",
  borderRadius: "0px",
  borderRadiusLg: "0px",
};
