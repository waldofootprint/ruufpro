// Hero section — the first thing a homeowner sees.
// Must pass the 2-second test: business name, what they do, where,
// click-to-call, and one trust signal — all visible without scrolling.

interface HeroProps {
  businessName: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  phone: string;
  isLicensed: boolean;
  isInsured: boolean;
  yearsInBusiness: number | null;
}

export default function Hero({
  businessName,
  headline,
  subheadline,
  ctaText,
  phone,
  isLicensed,
  isInsured,
  yearsInBusiness,
}: HeroProps) {
  // Build trust badge text from whatever the roofer has checked
  const trustBadges: string[] = [];
  if (isLicensed && isInsured) trustBadges.push("Licensed & Insured");
  else if (isLicensed) trustBadges.push("Licensed");
  else if (isInsured) trustBadges.push("Insured");
  if (yearsInBusiness && yearsInBusiness >= 5)
    trustBadges.push(`${yearsInBusiness}+ Years Experience`);

  return (
    <section className="relative bg-brand-900 text-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-200 mb-3">
          {businessName}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
          {headline}
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl">
          {subheadline}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            {ctaText}
          </a>
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            className="inline-flex items-center justify-center rounded-md border-2 border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Call Now: {phone}
          </a>
        </div>

        {trustBadges.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 text-sm text-brand-200"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
