// Why Choose Us — auto-generated trust badges from the roofer's checkbox selections.
// Only shows badges for things the roofer has actually checked.
// If nothing is checked, this section is hidden entirely.

import type { Contractor } from "@/lib/types";

interface WhyChooseUsProps {
  contractor: Contractor;
}

export default function WhyChooseUs({ contractor }: WhyChooseUsProps) {
  // Build the list of trust items from what the roofer has checked
  const items: { label: string; detail: string }[] = [];

  if (contractor.years_in_business && contractor.years_in_business > 0) {
    items.push({
      label: `${contractor.years_in_business}+ Years`,
      detail: `Serving ${contractor.city} since ${new Date().getFullYear() - contractor.years_in_business}`,
    });
  }

  if (contractor.is_licensed) {
    items.push({
      label: "Licensed",
      detail: contractor.license_number
        ? `License #${contractor.license_number}`
        : "Licensed Contractor",
    });
  }

  if (contractor.is_insured) {
    items.push({ label: "Fully Insured", detail: "General liability & workers' comp" });
  }

  if (contractor.gaf_master_elite) {
    items.push({ label: "GAF Master Elite", detail: "Top 2% of roofers nationwide" });
  }

  if (contractor.owens_corning_preferred) {
    items.push({ label: "Owens Corning Preferred", detail: "Certified installer" });
  }

  if (contractor.warranty_years && contractor.warranty_years > 0) {
    items.push({
      label: `${contractor.warranty_years}-Year Warranty`,
      detail: "Workmanship guarantee",
    });
  }

  if (contractor.offers_financing) {
    items.push({ label: "Financing Available", detail: "Flexible payment options" });
  }

  if (contractor.bbb_accredited) {
    items.push({
      label: "BBB Accredited",
      detail: contractor.bbb_rating ? `${contractor.bbb_rating} Rating` : "Accredited Business",
    });
  }

  // Don't render the section if there's nothing to show
  if (items.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-brand-900 text-white">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-3xl font-bold mb-12 text-center">
          Why Choose Us
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-lg font-bold text-white mb-1">
                {item.label}
              </div>
              <div className="text-sm text-brand-200">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
