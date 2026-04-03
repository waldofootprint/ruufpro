// Static registry of all website templates and their feature status.
// Update feature booleans as competitive upgrades land.

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  demoPath: string;
  status: "production" | "in-progress" | "partial";
  sectionCount: number;
  colors: { bg: string; accent: string; text: string };
  features: {
    floatingCta: boolean;
    textUs: boolean;
    reviewBadge: boolean;
    urgencyBadge: boolean;
    dualCtas: boolean;
    cityPages: boolean;
  };
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "modern_clean",
    name: "Modern Clean",
    description: "Premium with dual scroll animations — material transformation + cutaway x-ray",
    demoPath: "/demo",
    status: "production",
    sectionCount: 16,
    colors: { bg: "#FFFFFF", accent: "#1E3A5F", text: "#0F172A" },
    features: {
      floatingCta: true,
      textUs: true,
      reviewBadge: true,
      urgencyBadge: false, // uses ScrollAnimation instead of traditional hero
      dualCtas: true,
      cityPages: true,
    },
  },
  {
    id: "chalkboard",
    name: "Chalkboard",
    description: "Dark green-gray with chalk yellow accents, marquee trust bar, stats card",
    demoPath: "/demo/chalkboard",
    status: "production",
    sectionCount: 15,
    colors: { bg: "#2A2D2A", accent: "#F6C453", text: "#E8E5D8" },
    features: {
      floatingCta: true,
      textUs: true,
      reviewBadge: true,
      urgencyBadge: true,
      dualCtas: true,
      cityPages: true,
    },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "Cool white + slate blue, clean and trustworthy, floating stat card",
    demoPath: "/demo/blueprint",
    status: "production",
    sectionCount: 12,
    colors: { bg: "#F5F7FA", accent: "#4A6FA5", text: "#0F172A" },
    features: {
      floatingCta: true,
      textUs: true,
      reviewBadge: true,
      urgencyBadge: true,
      dualCtas: true,
      cityPages: true,
    },
  },
  {
    id: "classic",
    name: "Classic",
    description: "Clean corporate, monochromatic with diagonal image collage hero",
    demoPath: "/demo/classic",
    status: "production",
    sectionCount: 11,
    colors: { bg: "#FFFFFF", accent: "#2D2D2D", text: "#1C1C1C" },
    features: {
      floatingCta: true,
      textUs: true,
      reviewBadge: true,
      urgencyBadge: true,
      dualCtas: true,
      cityPages: true,
    },
  },
  {
    id: "forge",
    name: "Forge",
    description: "Dark, bold, industrial — black bg with blue accent, full-bleed image hero",
    demoPath: "/demo/forge",
    status: "production",
    sectionCount: 11,
    colors: { bg: "#0D0D0D", accent: "#2E5090", text: "#FFFFFF" },
    features: {
      floatingCta: true,
      textUs: true,
      reviewBadge: true,
      urgencyBadge: true,
      dualCtas: true,
      cityPages: true,
    },
  },
  {
    id: "apex",
    name: "Apex",
    description: "Minimal premium — hero only, in development",
    demoPath: "/demo",
    status: "partial",
    sectionCount: 1,
    colors: { bg: "#F5F3F0", accent: "#1E3A5F", text: "#0F172A" },
    features: {
      floatingCta: true,
      textUs: true,
      reviewBadge: false,
      urgencyBadge: false,
      dualCtas: false,
      cityPages: false,
    },
  },
  {
    id: "summit",
    name: "Summit",
    description: "Warm neutral — hero only, in development",
    demoPath: "/demo/summit",
    status: "partial",
    sectionCount: 1,
    colors: { bg: "#F5F3F0", accent: "#1E3A5F", text: "#0F172A" },
    features: {
      floatingCta: false,
      textUs: false,
      reviewBadge: false,
      urgencyBadge: false,
      dualCtas: false,
      cityPages: false,
    },
  },
];
