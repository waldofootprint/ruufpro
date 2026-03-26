// Smart defaults for each business type.
// When a roofer signs up with just their name, phone, city, and business type,
// these defaults fill in everything else so the site looks complete immediately.
// The roofer can override any of these later from their dashboard.

import type { BusinessType } from "./types";

interface TemplateDefaults {
  headline: string; // Hero headline — [City] gets replaced
  subheadline: string; // Below the headline
  ctaText: string; // Primary CTA button
  services: { name: string; description: string }[];
  aboutText: string; // [Business] and [City] get replaced
  metaTitle: string; // SEO title — [Business] and [City] get replaced
  metaDescription: string; // SEO description
}

const DEFAULTS: Record<BusinessType, TemplateDefaults> = {
  storm_insurance: {
    headline: "Storm Damage? We're Here to Help.",
    subheadline: "24/7 Emergency Roofing in [City]",
    ctaText: "Get Free Storm Inspection",
    services: [
      {
        name: "Storm Damage Repair",
        description:
          "Fast response to hail, wind, and storm damage. We secure your home and start repairs immediately.",
      },
      {
        name: "Insurance Claims",
        description:
          "We work directly with your insurance company to make the claims process simple and stress-free.",
      },
      {
        name: "Emergency Tarping",
        description:
          "24/7 emergency tarping to prevent further damage. Call us any time, day or night.",
      },
      {
        name: "Full Roof Replacement",
        description:
          "When repairs aren't enough, we handle complete roof replacements with top-quality materials.",
      },
    ],
    aboutText:
      "[Business] helps [City] homeowners navigate storm damage and insurance claims. When severe weather strikes, we respond fast with emergency tarping, thorough inspections, and expert repairs. We work directly with your insurance company so you can focus on what matters.",
    metaTitle: "[Business] — Storm Damage Roofing in [City]",
    metaDescription:
      "[Business] provides 24/7 emergency roofing, storm damage repair, and insurance claim assistance in [City] and surrounding areas. Free inspections.",
  },

  residential: {
    headline: "Trusted Roofing in [City]",
    subheadline: "Quality Roof Replacement & Repair You Can Count On",
    ctaText: "Get Your Free Estimate",
    services: [
      {
        name: "Roof Replacement",
        description:
          "Complete roof replacement with premium materials and expert installation. Built to last.",
      },
      {
        name: "Roof Repair",
        description:
          "Leaks, missing shingles, flashing issues — we diagnose and fix problems fast.",
      },
      {
        name: "Roof Inspections",
        description:
          "Thorough inspections to assess your roof's condition. Perfect before buying or selling a home.",
      },
      {
        name: "Gutter Installation",
        description:
          "Protect your home's foundation with properly installed gutters and downspouts.",
      },
    ],
    aboutText:
      "[Business] has proudly served [City] homeowners with quality roof installations and repairs. We believe in doing the job right the first time — using premium materials, skilled crews, and standing behind every project with our workmanship warranty.",
    metaTitle: "[Business] — Roof Replacement & Repair in [City]",
    metaDescription:
      "[Business] offers professional roof replacement, repair, and inspections in [City]. Licensed, insured, and trusted by homeowners. Free estimates.",
  },

  full_service: {
    headline: "Your Home, Our Expertise",
    subheadline: "[City]'s Trusted Contractor for Roofing, Siding & More",
    ctaText: "Get Your Free Estimate",
    services: [
      {
        name: "Roofing",
        description:
          "Complete roof replacement, repairs, and inspections for residential and commercial properties.",
      },
      {
        name: "Siding",
        description:
          "Vinyl, fiber cement, and wood siding installation and repair. Transform your home's exterior.",
      },
      {
        name: "Gutters",
        description:
          "Seamless gutter installation, gutter guards, and downspout systems to protect your foundation.",
      },
      {
        name: "Windows & Doors",
        description:
          "Energy-efficient window and door replacement. Improve comfort and curb appeal.",
      },
    ],
    aboutText:
      "[Business] is [City]'s trusted contractor for roofing, siding, gutters, and more. As a full-service exterior contractor, we handle everything from roof replacements to window installations — one crew, one point of contact, done right.",
    metaTitle: "[Business] — Roofing, Siding & Gutters in [City]",
    metaDescription:
      "[Business] is a full-service contractor in [City] offering roofing, siding, gutters, and windows. One call handles it all. Free estimates.",
  },
};

// Replace [Business] and [City] placeholders with actual values
function fillPlaceholders(
  text: string,
  businessName: string,
  city: string
): string {
  return text.replace(/\[Business\]/g, businessName).replace(/\[City\]/g, city);
}

// Get the complete content for a contractor's site,
// merging their custom content with smart defaults.
export function getSiteContent(
  businessType: BusinessType,
  businessName: string,
  city: string,
  overrides: {
    headline?: string | null;
    ctaText?: string | null;
    aboutText?: string | null;
    services?: string[] | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
  } = {}
) {
  const defaults = DEFAULTS[businessType];

  return {
    headline: overrides.headline || fillPlaceholders(defaults.headline, businessName, city),
    subheadline: fillPlaceholders(defaults.subheadline, businessName, city),
    ctaText: overrides.ctaText || defaults.ctaText,
    services: overrides.services
      ? overrides.services.map((name) => ({ name, description: "" }))
      : defaults.services,
    aboutText: overrides.aboutText || fillPlaceholders(defaults.aboutText, businessName, city),
    metaTitle: overrides.metaTitle || fillPlaceholders(defaults.metaTitle, businessName, city),
    metaDescription:
      overrides.metaDescription || fillPlaceholders(defaults.metaDescription, businessName, city),
  };
}
