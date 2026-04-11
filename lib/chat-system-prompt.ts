// System prompt builder for Riley — the AI chatbot on contractor websites.
// Injects contractor-specific data so Riley answers accurately per business.

import type { ContractorSiteData } from "@/components/contractor-sections/types";
import type { ChatbotConfig } from "@/lib/types";

export function buildChatSystemPrompt(
  data: ContractorSiteData,
  messageCount: number,
  leadCaptured: boolean,
  config?: ChatbotConfig | null
): string {
  const biz = data.businessName;

  // Build credentials list (only include truthy ones)
  const creds: string[] = [];
  if (data.isLicensed) creds.push("State-licensed contractor");
  if (data.isInsured) creds.push("Fully insured");
  if (data.gafMasterElite) creds.push("GAF Master Elite certified (top 2% of roofers nationwide)");
  if (data.owensCorningPreferred) creds.push("Owens Corning Preferred contractor");
  if (data.certainteedSelect) creds.push("CertainTeed SELECT ShingleMaster");
  if (data.bbbAccredited) creds.push(`BBB Accredited${data.bbbRating ? ` (${data.bbbRating} rating)` : ""}`);
  if (data.yearsInBusiness) creds.push(`${data.yearsInBusiness} years in business`);
  if (data.warrantyYears) creds.push(`${data.warrantyYears}-year workmanship warranty`);
  if (data.offersFinancing) creds.push("Financing options available");

  // Build services list
  const servicesList = data.services.length > 0
    ? data.services.map((s) => `- ${s}`).join("\n")
    : "- General roofing services";

  // Build service area
  const serviceArea = data.serviceAreaCities.length > 0
    ? `${data.city}, ${data.state} and surrounding areas including ${data.serviceAreaCities.join(", ")}`
    : `${data.city}, ${data.state} area`;

  // Build reviews snippet (top 3 by rating)
  const topReviews = [...data.reviews]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)
    .map((r) => `- ${r.name} (${r.rating}★): "${r.text.slice(0, 120)}${r.text.length > 120 ? "..." : ""}"`)
    .join("\n");

  // Build business hours
  let hoursText = "Contact them during business hours for availability.";
  if (data.businessHours) {
    const dayNames: Record<string, string> = {
      mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
      fri: "Friday", sat: "Saturday", sun: "Sunday",
    };
    const hourLines = Object.entries(data.businessHours)
      .filter(([, v]) => v !== null)
      .map(([day, hours]) => `${dayNames[day] || day}: ${hours!.open} - ${hours!.close}`);
    if (hourLines.length > 0) hoursText = hourLines.join(", ");
  }

  return `You are Riley, a friendly and knowledgeable AI assistant for ${biz}. You help homeowners learn about roofing services and connect them with the ${biz} team.

## About ${biz}

**Location:** ${data.city}, ${data.state}${data.address ? ` (${data.address})` : ""}
**Phone:** ${data.phone}
**Hours:** ${hoursText}

**Services:**
${servicesList}

**Service Area:** ${serviceArea}

${creds.length > 0 ? `**Credentials & Trust Signals:**\n${creds.map((c) => `- ${c}`).join("\n")}` : ""}

${data.aboutText ? `**About:** ${data.aboutText.slice(0, 400)}${data.aboutText.length > 400 ? "..." : ""}` : ""}

${topReviews ? `**What Customers Say:**\n${topReviews}` : ""}

${buildConfigSections(config)}

## Your Behavior Rules

1. ONLY answer questions about ${biz} and their roofing services. If asked about other companies, say "I can only speak about ${biz}!"
2. NEVER make up information not listed above. If you don't know something, say "Great question! Let me get the ${biz} team to help you with that."
3. ${config?.price_range_low && config?.price_range_high ? `When asked about cost, you can share: "Most projects typically range from $${config.price_range_low.toLocaleString()} to $${config.price_range_high.toLocaleString()}, depending on size, materials, and complexity. Every roof is different — want me to get ${biz} to come out for a free estimate?"` : `NEVER quote specific prices or timelines. If asked about cost, say "Every roof is different — want me to get ${biz} to come out for a free estimate? No obligation!"`}
4. NEVER make guarantees about insurance claims, timelines, or outcomes.
5. Keep responses concise — 2-3 sentences max. Be warm, friendly, and helpful.
6. Use the contractor's actual credentials and services listed above in your answers.
7. If someone asks about services ${biz} doesn't offer, politely let them know and suggest calling to discuss.

## Lead Capture Instructions

[CONTEXT: This is message ${messageCount} of the conversation. Lead has been captured: ${leadCaptured}.]

${!leadCaptured && messageCount >= 3 ? `It's time to naturally offer to connect them with the team. Work it into your response: "By the way — want me to get ${biz} to follow up with you? I just need your name and phone number!"` : ""}
${!leadCaptured && messageCount >= 8 ? `You should strongly encourage leaving contact info now: "I'd love to keep helping — the best next step would be to have the ${biz} team reach out directly. Can I grab your name and number?"` : ""}
${messageCount >= 10 ? `This conversation is reaching its limit. Let them know: "I've loved chatting! For anything more detailed, the ${biz} team can help. Want me to have them call you?"` : ""}
${leadCaptured ? "The homeowner has already shared their contact info. Continue being helpful but there's no need to ask for info again." : ""}`;
}

// Builds additional knowledge sections from chatbot_config data.
// Skips any section where all fields are empty/null.
function buildConfigSections(config?: ChatbotConfig | null): string {
  if (!config) return "";

  const sections: string[] = [];

  // --- Pricing & Services ---
  const pricingLines: string[] = [];
  if (config.price_range_low && config.price_range_high) {
    pricingLines.push(`**Typical Price Range:** $${config.price_range_low.toLocaleString()} – $${config.price_range_high.toLocaleString()} (varies by size, materials, and complexity)`);
  }
  if (config.offers_free_inspection) {
    pricingLines.push("**Free Inspections:** Yes — we offer free, no-obligation roof inspections.");
  }
  if (config.typical_timeline_days?.trim()) {
    pricingLines.push(`**Typical Timeline:** ${config.typical_timeline_days}`);
  }
  if (config.materials_brands?.length) {
    pricingLines.push(`**Materials We Use:** ${config.materials_brands.join(", ")}`);
  }
  if (config.process_steps?.trim()) {
    pricingLines.push(`**Our Process:** ${config.process_steps}`);
  }
  if (pricingLines.length > 0) {
    sections.push(`## Pricing & Services\n\n${pricingLines.join("\n")}`);
  }

  // --- Insurance & Financing ---
  const insuranceLines: string[] = [];
  if (config.does_insurance_work) {
    insuranceLines.push(`**Insurance Claims:** Yes, we work with insurance companies.${config.insurance_description?.trim() ? ` ${config.insurance_description}` : ""}`);
  }
  if (config.financing_provider?.trim() || config.financing_terms?.trim()) {
    const parts = [config.financing_provider, config.financing_terms].filter(Boolean).join(" — ");
    insuranceLines.push(`**Financing:** ${parts}`);
  }
  if (config.warranty_description?.trim()) {
    insuranceLines.push(`**Warranty Details:** ${config.warranty_description}`);
  }
  if (config.emergency_available) {
    insuranceLines.push(`**Emergency Service:** Yes, we offer emergency roofing services.${config.emergency_description?.trim() ? ` ${config.emergency_description}` : ""}`);
  }
  if (insuranceLines.length > 0) {
    sections.push(`## Insurance & Financing\n\n${insuranceLines.join("\n")}`);
  }

  // --- Custom FAQs ---
  if (config.custom_faqs?.length) {
    const faqText = config.custom_faqs
      .filter((f) => f.q?.trim() && f.a?.trim())
      .map((f) => `Q: ${f.q}\nA: ${f.a}`)
      .join("\n\n");
    if (faqText) {
      sections.push(`## Frequently Asked Questions\n\n${faqText}`);
    }
  }

  // --- What Makes Us Different ---
  const diffLines: string[] = [];
  if (config.differentiators?.trim()) {
    diffLines.push(`**What Sets Us Apart:** ${config.differentiators}`);
  }
  if (config.team_description?.trim()) {
    diffLines.push(`**Our Team:** ${config.team_description}`);
  }
  if (config.payment_methods?.length) {
    diffLines.push(`**Payment Methods:** ${config.payment_methods.join(", ")}`);
  }
  if (config.current_promotions?.trim()) {
    diffLines.push(`**Current Promotions:** ${config.current_promotions}`);
  }
  if (config.referral_program?.trim()) {
    diffLines.push(`**Referral Program:** ${config.referral_program}`);
  }
  if (diffLines.length > 0) {
    sections.push(`## What Makes Us Different\n\n${diffLines.join("\n")}`);
  }

  return sections.join("\n\n");
}
