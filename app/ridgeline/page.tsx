import RidgelineHero from "@/components/ui/hero";
import RidgelineGoogleFilter from "@/components/ridgeline/google-filter";
import RidgelineWhatsTheCatch from "@/components/ridgeline/whats-the-catch";
import RidgelineDemo from "@/components/ridgeline/demo";
import RidgelineHowItWorks from "@/components/ridgeline/how-it-works";
import RidgelineSEOAdvantage from "@/components/ridgeline/seo-advantage";
import RidgelineComparison from "@/components/ridgeline/competitor-comparison";
import RidgelineSocialProof from "@/components/ridgeline/social-proof";
import RidgelineProFeatures from "@/components/ridgeline/pro-features";
import RidgelinePricing from "@/components/ridgeline/pricing";
import RidgelineFAQ from "@/components/ridgeline/faq";
import RidgelineFinalCTA from "@/components/ridgeline/final-cta";
import RidgelineStickyMobileCTA from "@/components/ridgeline/sticky-mobile-cta";

export default function Page() {
  return (
    <div className="w-full h-full min-h-screen">
      {/* Pain — urgency + cost of inaction */}
      <RidgelineHero />
      <RidgelineGoogleFilter />
      <RidgelineWhatsTheCatch />

      {/* Solution — see it work */}
      <RidgelineDemo />
      <RidgelineHowItWorks />
      <RidgelineSEOAdvantage />

      {/* Proof — trust + comparison */}
      <RidgelineComparison />
      <RidgelineSocialProof />

      {/* Show what Pro unlocks */}
      <RidgelineProFeatures />

      {/* Decision */}
      <RidgelinePricing />

      {/* Close */}
      <RidgelineFAQ />
      <RidgelineFinalCTA />
      <RidgelineStickyMobileCTA />
    </div>
  );
}
