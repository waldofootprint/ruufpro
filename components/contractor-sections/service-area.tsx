"use client";

import { THEME } from "./theme";
import type { ContractorSiteData } from "./types";
import ServiceAreaMap from "./service-area-map";

type ServiceAreaProps = Pick<ContractorSiteData, "city" | "state" | "serviceAreaCities">;

export default function ServiceArea({ city, state, serviceAreaCities }: ServiceAreaProps) {
  return (
    <ServiceAreaMap
      city={city}
      state={state}
      serviceAreaCities={serviceAreaCities}
      accent={THEME.accent}
      accentFaded="rgba(232,114,12,0.2)"
      text={THEME.textPrimary}
      textMuted={THEME.textSecondary}
      textFaint={THEME.textMuted}
      bg="#fff"
      border={THEME.border}
      borderDashed={THEME.border}
      fontDisplay={THEME.fontDisplay}
      fontBody={THEME.fontBody}
      activeTagBg={THEME.accent}
      activeTagColor="#fff"
      inactiveTagBg="#fff"
      inactiveTagColor={THEME.textPrimary}
      inactiveTagBorder={THEME.border}
    />
  );
}
