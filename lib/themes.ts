// Theme config for contractor template websites.
// Each design style (modern_clean, bold_confident, warm_trustworthy) gets its
// own theme object that controls colors, fonts, and border radius.
// This keeps the section components reusable across all three styles.

export interface ContractorTheme {
  name: string;
  fonts: {
    heading: string; // CSS font-family for h1, h2, etc.
    body: string; // CSS font-family for body text, buttons, labels
  };
  colors: {
    accent: string; // Primary accent (CTA buttons, links)
    accentHover: string; // Accent hover state
    accentLight: string; // Light accent (badge backgrounds)
    heroBg: string; // Hero section background
    heroText: string; // Hero headline color
    heroMuted: string; // Hero subtext color
    footerBg: string; // Footer background
  };
  radius: {
    button: string; // Button border-radius class
    card: string; // Card border-radius class
    input: string; // Form input border-radius class
  };
}

export const THEMES: Record<string, ContractorTheme> = {
  modern_clean: {
    name: "Modern Clean",
    fonts: {
      heading: "'DM Serif Display', serif",
      body: "'DM Sans', sans-serif",
    },
    colors: {
      accent: "bg-blue-600",
      accentHover: "hover:bg-blue-700",
      accentLight: "bg-blue-50",
      heroBg: "bg-gray-900",
      heroText: "text-white",
      heroMuted: "text-gray-400",
      footerBg: "bg-gray-900",
    },
    radius: {
      button: "rounded-lg",
      card: "rounded-xl",
      input: "rounded-lg",
    },
  },
};
