"use client";

import type { ContractorSiteData } from "../contractor-sections/types";
import FloatingEstimateCTA from "../contractor-sections/floating-estimate-cta";
import FloatingTextUs from "../contractor-sections/floating-text-us";
import ChatWidget from "../chat-widget/ChatWidget";
import ApexHero from "../contractor-sections/apex/hero";

interface ApexTemplateProps {
  templateData: ContractorSiteData;
}

export default function ApexTemplate({ templateData }: ApexTemplateProps) {
  const d = templateData;

  return (
    <main>
      <ApexHero
        businessName={d.businessName}
        phone={d.phone}
        city={d.city}
        heroHeadline={d.heroHeadline}
        tagline={d.tagline}
        heroCta={d.heroCta}
        heroImage={d.heroImage}
        hasEstimateWidget={d.hasEstimateWidget}
        yearsInBusiness={d.yearsInBusiness}
        isLicensed={d.isLicensed}
        isInsured={d.isInsured}
      />
      <FloatingEstimateCTA hasEstimateWidget={d.hasEstimateWidget} phone={d.phone} />
      <FloatingTextUs phone={d.phone} />
      <ChatWidget
        contractorId={d.contractorId}
        businessName={d.businessName}
        hasAiChatbot={d.hasAiChatbot ?? false}
        customGreeting={d.chatGreeting}
        accentColor="#2563EB"
        fontFamily="'Inter', sans-serif"
      />
    </main>
  );
}
