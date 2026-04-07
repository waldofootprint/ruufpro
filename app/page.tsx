import Component from "@/components/ui/hero";
import RidgelineDemo from "@/components/ridgeline/demo";
import RidgelineGoogleFilter from "@/components/ridgeline/google-filter";
import RidgelineSEOAdvantage from "@/components/ridgeline/seo-advantage";
import RidgelineProFeatures from "@/components/ridgeline/pro-features";
import RidgelineHowItWorks from "@/components/ridgeline/how-it-works";
import RidgelineWhatsTheCatch from "@/components/ridgeline/whats-the-catch";
import RidgelineComparison from "@/components/ridgeline/competitor-comparison";
import RidgelineSocialProof from "@/components/ridgeline/social-proof";
import RidgelinePricing from "@/components/ridgeline/pricing";
import RidgelineFAQ from "@/components/ridgeline/faq";
import RidgelineFinalCTA from "@/components/ridgeline/final-cta";
import RidgelineFooter from "@/components/ridgeline/footer";

export default function Home() {
  return (
    <div className="w-full h-full min-h-screen">
      <Component />
      <RidgelineDemo />
      <RidgelineGoogleFilter />
      <RidgelineSEOAdvantage />
      <RidgelineProFeatures />
      <RidgelineHowItWorks />
      <RidgelineWhatsTheCatch />
      <RidgelineComparison />
      <RidgelineSocialProof />
      <RidgelinePricing />
      <RidgelineFAQ />
      <RidgelineFinalCTA />
      <RidgelineFooter />
    </div>
  );
}
