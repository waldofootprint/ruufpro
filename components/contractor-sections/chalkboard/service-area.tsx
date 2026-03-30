"use client";

import { CHALK } from "../theme-chalkboard";
import type { ContractorSiteData } from "../types";
import ServiceAreaMap from "../service-area-map";

type Props = Pick<ContractorSiteData, "city" | "state" | "serviceAreaCities">;

export default function ChalkServiceArea({ city, state, serviceAreaCities }: Props) {
  return (
    <ServiceAreaMap
      city={city}
      state={state}
      serviceAreaCities={serviceAreaCities}
      accent={CHALK.accent}
      accentFaded="rgba(246,196,83,0.2)"
      text={CHALK.text}
      textMuted={CHALK.textMuted}
      textFaint={CHALK.textFaint}
      bg={CHALK.bg}
      border={CHALK.border}
      borderDashed={CHALK.borderDashed}
      fontDisplay={CHALK.fontDisplay}
      fontBody={CHALK.fontBody}
      activeTagBg={CHALK.accent}
      activeTagColor={CHALK.bg}
      inactiveTagBg="rgba(255,255,255,0.05)"
      inactiveTagColor={CHALK.text}
      inactiveTagBorder={CHALK.border}
    />
  );
}
