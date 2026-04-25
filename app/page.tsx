import Component from "@/components/ridgeline-v2/hero";
import RidgelineDemo from "@/components/ridgeline-v2/demo";
import RidgelineGoogleFilter from "@/components/ridgeline-v2/evidence";
import RidgelineProFeatures from "@/components/ridgeline-v2/features";
import RidgelineHowItWorks from "@/components/ridgeline-v2/how-it-works";
import RidgelinePricing from "@/components/ridgeline-v2/pricing";
import RidgelineFAQ from "@/components/ridgeline-v2/faq";
import RidgelineFinalCTA from "@/components/ridgeline-v2/final-cta";
import RidgelineFooter from "@/components/ridgeline-v2/footer";

export default function Home() {
  return (
    <div className="w-full h-full min-h-screen">
      <Component />
      <RidgelineDemo />
      <RidgelineGoogleFilter />
      <RidgelineProFeatures />
      <RidgelineHowItWorks />
      <RidgelinePricing />
      <RidgelineFAQ />
      <RidgelineFinalCTA />
      <RidgelineFooter />
    </div>
  );
}
