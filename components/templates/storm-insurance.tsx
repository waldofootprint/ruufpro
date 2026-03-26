// Storm/Insurance template — for roofers who chase storms and handle
// insurance claims. Urgent tone, emergency language, 24/7 availability.
//
// This component assembles the shared section components in the right
// order with storm-specific styling. The Residential and Full Service
// templates will use the same sections in different arrangements.

import type { Contractor, Site, Review } from "@/lib/types";
import Hero from "@/components/sections/hero";
import ServicesGrid from "@/components/sections/services-grid";
import WhyChooseUs from "@/components/sections/why-choose-us";
import Reviews from "@/components/sections/reviews";
import ServiceArea from "@/components/sections/service-area";
import ContactForm from "@/components/sections/contact-form";
import Footer from "@/components/sections/footer";

interface StormInsuranceProps {
  contractor: Contractor;
  site: Site;
  content: {
    headline: string;
    subheadline: string;
    ctaText: string;
    services: { name: string; description: string }[];
    aboutText: string;
  };
}

export default function StormInsuranceTemplate({
  contractor,
  site,
  content,
}: StormInsuranceProps) {
  return (
    <main className="min-h-screen">
      <Hero
        businessName={contractor.business_name}
        headline={content.headline}
        subheadline={content.subheadline}
        ctaText={content.ctaText}
        phone={contractor.phone}
        isLicensed={contractor.is_licensed}
        isInsured={contractor.is_insured}
        yearsInBusiness={contractor.years_in_business}
      />

      <ServicesGrid services={content.services} />

      <WhyChooseUs contractor={contractor} />

      <Reviews reviews={site.reviews as Review[]} />

      <ServiceArea
        city={contractor.city}
        state={contractor.state}
        additionalCities={contractor.service_area_cities}
      />

      <ContactForm
        contractorId={contractor.id}
        siteId={site.id}
        phone={contractor.phone}
        city={contractor.city}
        state={contractor.state}
        address={contractor.address}
      />

      <Footer
        businessName={contractor.business_name}
        phone={contractor.phone}
        city={contractor.city}
        state={contractor.state}
        address={contractor.address}
        licenseNumber={contractor.license_number}
      />
    </main>
  );
}
