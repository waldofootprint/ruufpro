// Rich service page content for contractor websites.
// Each service has deep, SEO-friendly copy modeled after top-ranking roofing sites.
// Placeholders: {city}, {businessName}, {state} are interpolated at render time.

export interface ServicePageEntry {
  slug: string;
  name: string;
  headline: string;
  paragraphs: string[];
  subServices: string[];
}

export const SERVICE_PAGE_CONTENT: Record<string, ServicePageEntry> = {
  "Roof Replacement": {
    slug: "roof-replacement",
    name: "Roof Replacement",
    headline: "Full Roof Replacement in {city}, {state}",
    paragraphs: [
      "When repairs are no longer enough, a full roof replacement is the smartest investment you can make in your home. Whether your roof has reached the end of its lifespan, sustained severe storm damage, or is showing signs of widespread deterioration, {businessName} provides complete tear-off and replacement services throughout the {city} area.",
      "Our process starts with a thorough inspection of your existing roof and decking. We strip everything down to the sheathing, replace any rotted or damaged wood, then install new underlayment, drip edge, flashing, and your choice of roofing material. We handle the permit, the dumpster, and the full cleanup — you just pick your shingle color.",
      "Every replacement we do is backed by manufacturer warranties and our own workmanship guarantee. We use only premium materials from trusted brands and follow manufacturer installation specs to the letter, so your warranty is never at risk.",
    ],
    subServices: [
      "Asphalt Shingle Replacement",
      "Metal Roof Replacement",
      "Tile Roof Replacement",
      "Flat Roof Replacement",
      "Cedar Shake Replacement",
      "Full Tear-Off & Re-Roof",
      "Decking & Sheathing Repair",
    ],
  },

  "Roof Repair": {
    slug: "roof-repair",
    name: "Roof Repair",
    headline: "Expert Roof Repairs in {city}, {state}",
    paragraphs: [
      "Not every roof problem requires a full replacement. At {businessName}, we diagnose the actual issue and fix it right the first time — no upselling you a new roof when a targeted repair will do. From minor leaks to significant storm damage, our experienced crew handles it all.",
      "We repair all types of roofing systems, including asphalt shingles, metal panels, tile, flat membranes, and more. Common issues we fix include missing or cracked shingles, failed pipe boots, deteriorated flashing, sagging gutterlines, and persistent leaks that other contractors couldn't track down.",
      "Our repair process is straightforward: we inspect, we explain what we found (with photos), we give you an honest estimate, and we fix it. If your roof needs more than a repair, we'll tell you that too — but we'll never push a replacement when a repair will hold.",
    ],
    subServices: [
      "Asphalt Shingle Repair",
      "Metal Roof Repair",
      "Tile Roof Repair",
      "Flat Roof Repair",
      "Flashing Repair & Replacement",
      "Pipe Boot Replacement",
      "Roof Leak Repair",
      "Hail Damage Repair",
    ],
  },

  "Roof Installation": {
    slug: "roof-installation",
    name: "Roof Installation",
    headline: "New Roof Installation in {city}, {state}",
    paragraphs: [
      "Building a new home or adding an addition? {businessName} installs new roofing systems that are built to last in {state}'s climate. We work with builders, general contractors, and homeowners to deliver quality installations on schedule and on budget.",
      "No two roofs are the same, so we help you choose the roofing style and materials that provide the best protection for your home and budget. We're experienced with asphalt shingles, standing seam metal, tile, flat roofing systems, and specialty materials. Our team follows manufacturer installation specs precisely, which means your warranty is valid from day one.",
      "From new construction to additions and garage builds, we handle the entire installation process — framing coordination, underlayment, ventilation, flashing, and final roofing material. We leave the site clean and your new roof ready to protect your home for decades.",
    ],
    subServices: [
      "Asphalt Shingle Installation",
      "Standing Seam Metal Installation",
      "Tile Roof Installation",
      "Flat Roof Installation",
      "New Construction Roofing",
      "Addition & Garage Roofing",
    ],
  },

  "Inspections": {
    slug: "roof-inspection",
    name: "Roof Inspection",
    headline: "Professional Roof Inspections in {city}, {state}",
    paragraphs: [
      "The only way to truly know the condition of your roof is a professional inspection. At {businessName}, our certified inspectors climb up onto your roof and complete a detailed assessment of every component — decking, underlayment, flashing, vents, gutters, and shingle condition.",
      "You receive a complete written report with photos and honest recommendations. Whether the verdict is minor repairs, preventive maintenance, or a full replacement, you'll have the information you need to make an informed decision about your home's protection.",
      "We recommend annual inspections, especially after major storms. Catching a small problem early — a cracked pipe boot, a lifted shingle, a clogged valley — can save you thousands compared to letting it turn into water damage inside your walls or ceiling.",
    ],
    subServices: [
      "Annual Roof Inspection",
      "Pre-Purchase Home Inspection",
      "Post-Storm Damage Assessment",
      "Insurance Claim Documentation",
      "Warranty Compliance Inspection",
      "Drone-Assisted Roof Survey",
    ],
  },

  "Roof Maintenance": {
    slug: "roof-maintenance",
    name: "Roof Maintenance",
    headline: "Roof Maintenance Programs in {city}, {state}",
    paragraphs: [
      "Regular maintenance is the most cost-effective way to extend your roof's lifespan and avoid expensive emergency repairs. {businessName} offers comprehensive maintenance programs designed to keep your roof performing at its best year after year.",
      "Our maintenance visits include a thorough inspection, gutter cleaning, debris removal, minor repairs (resealing flashings, replacing cracked shingles, clearing clogged drains), and a written condition report. We catch small issues before they become big problems.",
      "Most roofing manufacturers require documented maintenance to keep warranties valid. By enrolling in a maintenance program with {businessName}, you protect both your roof and your warranty investment. We keep records of every visit so you're always covered.",
    ],
    subServices: [
      "Annual Maintenance Plans",
      "Gutter Cleaning & Debris Removal",
      "Flashing Resealing",
      "Minor Shingle Repairs",
      "Moss & Algae Treatment",
      "Drain & Valley Clearing",
    ],
  },

  "Storm Damage": {
    slug: "storm-damage",
    name: "Storm Damage",
    headline: "Storm Damage Restoration in {city}, {state}",
    paragraphs: [
      "Hail, high winds, fallen trees, and driving rain can cause serious damage to your roof — sometimes visible, sometimes hidden. {businessName} responds quickly to storm damage calls throughout the {city} metro area, helping homeowners protect their property and navigate the insurance process.",
      "We document every detail of the damage with photos and measurements that insurance adjusters need. Our team works directly with your insurance company to ensure your claim covers the full scope of repairs, and we handle the restoration from start to finish.",
      "Whether you need emergency tarping to stop active leaks, partial repairs to damaged sections, or a complete roof replacement after a major storm, we have the crew and materials to get your home protected fast.",
    ],
    subServices: [
      "Hail Damage Repair",
      "Wind Damage Restoration",
      "Fallen Tree & Debris Removal",
      "Insurance Claim Assistance",
      "Full Storm Damage Restoration",
      "Post-Storm Inspection",
    ],
  },

  "Emergency Tarping": {
    slug: "emergency-tarping",
    name: "Emergency Tarping",
    headline: "24/7 Emergency Roof Tarping in {city}, {state}",
    paragraphs: [
      "When a storm, fallen tree, or sudden failure leaves your roof exposed, every hour counts. Water pouring into your home causes exponential damage — to insulation, drywall, electrical systems, and personal belongings. {businessName} provides emergency tarping services to stop the damage fast.",
      "Call us any time — day or night — and we'll dispatch a crew to your location. We install heavy-duty tarps secured to your roof structure to create a watertight barrier until permanent repairs can be completed. Our goal is to get your home protected within hours, not days.",
      "Emergency tarping is a temporary solution, but it's a critical one. It prevents thousands of dollars in secondary water damage and gives you time to plan and budget for the right permanent repair without the pressure of an active leak.",
    ],
    subServices: [
      "24/7 Emergency Response",
      "Heavy-Duty Tarp Installation",
      "Temporary Leak Containment",
      "Board-Up Services",
      "Emergency Damage Assessment",
    ],
  },

  "Gutters": {
    slug: "gutters",
    name: "Gutters",
    headline: "Gutter Installation & Repair in {city}, {state}",
    paragraphs: [
      "Your gutters are your roof's drainage system — without them working properly, water pools on your fascia, runs down your siding, and damages your foundation. {businessName} installs, repairs, and maintains gutter systems that are properly sized and pitched to handle your roof's water volume.",
      "We install seamless aluminum gutters custom-fabricated on-site to fit your home perfectly. No seams means fewer leak points and a cleaner look. We also install gutter guards to keep debris out and reduce maintenance, plus properly routed downspouts to direct water away from your foundation.",
      "If your existing gutters are sagging, leaking at the seams, or overflowing during rain, we can repair or replace them. We also handle fascia board replacement when water damage has compromised the wood behind your gutters.",
    ],
    subServices: [
      "Seamless Aluminum Gutter Installation",
      "Gutter Guard Installation",
      "Gutter Repair & Resealing",
      "Downspout Installation & Routing",
      "Fascia Board Replacement",
      "Gutter Cleaning",
    ],
  },

  "Siding": {
    slug: "siding",
    name: "Siding",
    headline: "Siding Installation & Repair in {city}, {state}",
    paragraphs: [
      "Your siding is the first thing people see and the first line of defense against the elements. {businessName} installs and repairs vinyl, fiber cement, and wood siding throughout the {city} area — matching existing materials and handling all trim, soffit, and fascia work so everything looks right together.",
      "Whether you're replacing storm-damaged sections, upgrading from aging vinyl to modern fiber cement, or giving your home a complete exterior makeover, our crew delivers clean, precise installations that improve both curb appeal and weather protection.",
      "We pay close attention to the details that matter: proper flashing behind the siding, correct overlap and nailing patterns, sealed joints around windows and doors, and trim work that finishes the look professionally. The result is an exterior that looks great and keeps moisture out for years.",
    ],
    subServices: [
      "Vinyl Siding Installation",
      "Fiber Cement Siding (HardiePlank)",
      "Wood Siding Installation",
      "Siding Repair & Patching",
      "Soffit & Fascia Installation",
      "Trim & Accent Work",
    ],
  },

  "Ventilation": {
    slug: "ventilation",
    name: "Ventilation",
    headline: "Attic & Roof Ventilation in {city}, {state}",
    paragraphs: [
      "Proper attic ventilation extends your roof's life, reduces energy costs, and prevents moisture problems that lead to mold, rot, and ice dams. Most homes we inspect in the {city} area are under-ventilated — and the homeowners don't know it until damage has already started.",
      "{businessName} balances your attic's intake and exhaust ventilation to meet manufacturer specifications and building code requirements. We install ridge vents, soffit vents, gable vents, and powered attic fans depending on your roof design and attic configuration.",
      "Inadequate ventilation voids most roofing warranties and causes shingles to age prematurely from heat buildup. If you're getting a new roof or noticing high energy bills, hot upstairs rooms, or ice dams in winter, ventilation should be part of the conversation.",
    ],
    subServices: [
      "Ridge Vent Installation",
      "Soffit Vent Installation",
      "Powered Attic Fan Installation",
      "Gable Vent Installation",
      "Intake/Exhaust Balancing",
      "Ventilation Assessment",
    ],
  },

  "Soffit & Fascia": {
    slug: "soffit-fascia",
    name: "Soffit & Fascia",
    headline: "Soffit & Fascia Services in {city}, {state}",
    paragraphs: [
      "Soffit and fascia aren't just cosmetic — they protect your roof's edge, provide critical attic ventilation, and keep pests out of your home. When they're damaged, rotted, or missing, your roof system is compromised. {businessName} handles soffit and fascia repair and replacement throughout the {city} metro.",
      "We work with aluminum, vinyl, and wood materials to match your home's existing exterior. Our installations include proper venting through perforated soffit panels, sealed fascia boards that support your gutters, and clean trim work that finishes the roofline professionally.",
      "Common signs of soffit and fascia problems include peeling paint on the eaves, visible rot or soft spots, pest entry points, and gutters pulling away from the roofline. If you're seeing any of these, it's time for an inspection before water damage spreads further.",
    ],
    subServices: [
      "Soffit Replacement",
      "Fascia Board Replacement",
      "Aluminum Soffit & Fascia Wrapping",
      "Vented Soffit Panel Installation",
      "Rot & Water Damage Repair",
      "Pest Damage Repair",
    ],
  },
};

// Interpolate placeholders in content strings
export function interpolateContent(
  text: string,
  vars: { city: string; businessName: string; state: string }
): string {
  return text
    .replace(/\{city\}/g, vars.city)
    .replace(/\{businessName\}/g, vars.businessName)
    .replace(/\{state\}/g, vars.state);
}

// Get content for a service, handling name variations (e.g., "Inspections" → "Inspections" entry)
export function getServiceContent(serviceName: string): ServicePageEntry | null {
  // Direct match
  if (SERVICE_PAGE_CONTENT[serviceName]) {
    return SERVICE_PAGE_CONTENT[serviceName];
  }

  // Normalized matching for common variations
  const normalized = serviceName.toLowerCase().trim();
  for (const [key, entry] of Object.entries(SERVICE_PAGE_CONTENT)) {
    if (key.toLowerCase() === normalized) return entry;
    if (entry.slug === normalized.replace(/\s+/g, "-")) return entry;
  }

  return null;
}

// Get all service content for a contractor's service list, in order
export function getServicesForContractor(
  services: string[],
  vars: { city: string; businessName: string; state: string }
): (ServicePageEntry & { interpolated: { paragraphs: string[]; headline: string } })[] {
  const result: (ServicePageEntry & { interpolated: { paragraphs: string[]; headline: string } })[] = [];

  for (const svc of services) {
    const content = getServiceContent(svc);
    if (content) {
      result.push({
        ...content,
        interpolated: {
          headline: interpolateContent(content.headline, vars),
          paragraphs: content.paragraphs.map((p) => interpolateContent(p, vars)),
        },
      });
    }
  }

  return result;
}
