// Modern Clean theme — color tokens and shared values.
// Matches the approved HTML prototype palette.
// These are used as inline styles since the template needs to
// work as an embedded site without polluting the host's CSS.

export const THEME = {
  // Core colors
  primary: "#1E3A5F",        // dark navy
  accent: "#E8720C",         // orange
  accentHover: "#D4660A",    // darker orange
  bgWarm: "#F7F8FA",         // light gray background
  bgWhite: "#FFFFFF",
  textPrimary: "#1A1A2E",    // near-black
  textSecondary: "#5A5A6E",  // muted
  textMuted: "#8A8A9A",      // lighter muted
  border: "#EAEAE6",         // light border
  star: "#F59E0B",           // review stars
  success: "#16A34A",        // green checkmarks

  // Typography — uses CSS variables from next/font (loaded in app/layout.tsx)
  fontDisplay: "var(--font-sora), 'Sora', sans-serif",
  fontSerif: "var(--font-lora), 'Lora', Georgia, serif",
  fontBody: "var(--font-dm-sans), 'DM Sans', sans-serif",

  // Spacing
  sectionPadding: "80px 24px",
  sectionPaddingMobile: "48px 16px",
  maxWidth: "1140px",
  borderRadius: "16px",
  borderRadiusLg: "20px",
};
