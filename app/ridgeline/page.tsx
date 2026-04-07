import Component from "@/components/ui/hero";
import RidgelineGoogleFilter from "@/components/ridgeline/google-filter";
import RidgelineSocialProof from "@/components/ridgeline/social-proof";
import RidgelineWhatsTheCatch from "@/components/ridgeline/whats-the-catch";
import RidgelineHowItWorks from "@/components/ridgeline/how-it-works";
import RidgelineDemo from "@/components/ridgeline/demo";
import RidgelinePricing from "@/components/ridgeline/pricing";
import RidgelineFAQ from "@/components/ridgeline/faq";
import RidgelineFinalCTA from "@/components/ridgeline/final-cta";

export default function Page() {
  return (
    <div className="w-full h-full min-h-screen">
      <Component />
      <RidgelineGoogleFilter />
      <RidgelineSocialProof />
      <RidgelineWhatsTheCatch />
      <RidgelineHowItWorks />
      <RidgelineDemo />
      <RidgelinePricing />
      <RidgelineFAQ />
      <RidgelineFinalCTA />
    </div>
  );
}
