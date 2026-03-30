"use client";

import { BLUEPRINT } from "../theme-blueprint";
import type { ContractorSiteData } from "../types";
import ServiceAreaMap from "../service-area-map";

type Props = Pick<ContractorSiteData, "city" | "state" | "serviceAreaCities">;

export default function BlueprintServiceArea({ city, state, serviceAreaCities }: Props) {
  return (
    <ServiceAreaMap
      city={city}
      state={state}
      serviceAreaCities={serviceAreaCities}
      accent={BLUEPRINT.accent}
      accentFaded="rgba(74,111,165,0.2)"
      text={BLUEPRINT.text}
      textMuted={BLUEPRINT.textSecondary}
      textFaint={BLUEPRINT.textMuted}
      bg={BLUEPRINT.bg}
      border={BLUEPRINT.border}
      borderDashed={BLUEPRINT.borderDashed}
      fontDisplay={BLUEPRINT.fontDisplay}
      fontBody={BLUEPRINT.fontBody}
      activeTagBg={BLUEPRINT.accent}
      activeTagColor="#FFFFFF"
      inactiveTagBg={BLUEPRINT.bgWhite}
      inactiveTagColor={BLUEPRINT.text}
      inactiveTagBorder={BLUEPRINT.border}
    />
  );
}
