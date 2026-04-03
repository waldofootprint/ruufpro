import SummitHero from "@/components/contractor-sections/summit/hero";

export default function SummitDemoPage() {
  return (
    <main style={{ background: "#F5F3F0", minHeight: "100vh" }}>
      <SummitHero
        businessName="Pinnacle Roofing Co."
        phone="(813) 555-0192"
        city="Tampa"
        heroHeadline="Your Roof. Done Right."
        tagline="Tampa Bay's trusted roofing experts since 2011."
        heroCta="Get Your Free Estimate"
        heroImage={null}
        hasEstimateWidget={true}
        yearsInBusiness={13}
      />
    </main>
  );
}
