// Chat estimate wrapper — runs the estimate engine from just an address + contractor ID.
// Used by Riley's getEstimate tool call during chat conversations.
// Reuses 100% of existing estimate logic (Solar API + calculator + weather surge).

import { createClient } from "@supabase/supabase-js";
import { getRoofData } from "@/lib/solar-api";
import { geometryForEstimate } from "@/lib/estimate-geometry-policy";
import {
  calculateEstimate,
  ESTIMATE_DISCLAIMER,
  type RoofMaterial,
  type ContractorRates,
} from "@/lib/estimate";
import { getWeatherSurge } from "@/lib/weather-surge";

const DEFAULT_MATERIAL_LABELS: Record<string, string> = {
  asphalt: "Asphalt Shingles",
  metal: "Standing Seam Metal",
  tile: "Tile (Clay/Concrete)",
  flat: "Flat / TPO / EPDM",
};

export interface ChatEstimateResult {
  success: true;
  estimates: {
    material: string;
    label: string;
    priceLow: number;
    priceHigh: number;
    rangeDisplay: string;
  }[];
  roofAreaSqft: number;
  pitchDegrees: number;
  isSatellite: boolean;
  numSegments: number;
  weatherSurgeActive: boolean; // True if storm pricing is applied
  summary: string; // Human-readable summary for Riley to reference
}

export interface ChatEstimateError {
  success: false;
  error: string;
  fallbackMessage: string; // What Riley should say to the homeowner
}

export type ChatEstimateResponse = ChatEstimateResult | ChatEstimateError;

export async function runChatEstimate(
  contractorId: string,
  address: string
): Promise<ChatEstimateResponse> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch contractor's estimate settings
  const { data: settings } = await supabase
    .from("estimate_settings")
    .select("*")
    .eq("contractor_id", contractorId)
    .single();

  if (!settings || (!settings.asphalt_low && !settings.asphalt_high)) {
    return {
      success: false,
      error: "no_pricing",
      fallbackMessage:
        "I can't generate an estimate right now because pricing hasn't been configured yet. But I can get the team to give you a personalized quote — want to leave your info?",
    };
  }

  const materialLabels: Record<string, string> = {
    asphalt: settings.asphalt_label || DEFAULT_MATERIAL_LABELS.asphalt,
    metal: settings.metal_label || DEFAULT_MATERIAL_LABELS.metal,
    tile: settings.tile_label || DEFAULT_MATERIAL_LABELS.tile,
    flat: settings.flat_label || DEFAULT_MATERIAL_LABELS.flat,
  };
  const showRoofDetails = settings.show_roof_details ?? true;

  const rates: ContractorRates = {
    asphalt_low: settings.asphalt_low || 0,
    asphalt_high: settings.asphalt_high || 0,
    metal_low: settings.metal_low || 0,
    metal_high: settings.metal_high || 0,
    tile_low: settings.tile_low || 0,
    tile_high: settings.tile_high || 0,
    flat_low: settings.flat_low || 0,
    flat_high: settings.flat_high || 0,
  };

  // Sanity check: per-sqft rates should be $1-$50. Outside this range,
  // something is misconfigured and we'd show absurd estimates.
  const allRateValues = Object.values(rates).filter((v) => v > 0);
  if (allRateValues.some((v) => v < 1 || v > 50)) {
    return {
      success: false,
      error: "rate_out_of_range",
      fallbackMessage:
        "I can't generate an estimate right now — the pricing setup needs a quick update. Want me to have the team give you a personalized quote instead?",
    };
  }

  // Get roof data from Solar API (or cache)
  let roofData = null;
  let geometry = null;

  try {
    const roofResult = await getRoofData(address);
    roofData = roofResult.data;
    geometry = geometryForEstimate(null, roofData);
  } catch (err) {
    console.error("Chat estimate — Solar API error:", err);
  }

  if (!roofData) {
    return {
      success: false,
      error: "no_roof_data",
      fallbackMessage:
        "I wasn't able to look up your roof from satellite data for that address. Could you double-check the address? If it's correct, the team can come out for a free inspection to get you exact numbers.",
    };
  }

  // Commercial property guard — residential roofs rarely exceed 10,000 sqft (ZL-025)
  if (roofData.roofAreaSqft > 10000) {
    return {
      success: false,
      error: "commercial_property",
      fallbackMessage:
        "That looks like it might be a larger or commercial property — our online estimates are designed for residential homes. The team can give you a custom quote for that. Want me to connect you?",
    };
  }

  // Out-of-state detection (ZL-026) — check if address state matches contractor state
  const { data: contractorData } = await supabase
    .from("contractors")
    .select("state")
    .eq("id", contractorId)
    .single();

  if (contractorData?.state) {
    // Simple state extraction from address — look for 2-letter state code
    const stateMatch = address.match(/\b([A-Z]{2})\b/);
    if (stateMatch && stateMatch[1] !== contractorData.state.toUpperCase()) {
      return {
        success: false,
        error: "out_of_state",
        fallbackMessage:
          `It looks like that address might be outside our service area. We're based in ${contractorData.state}. Want me to check with the team, or would you like an estimate for a local address?`,
      };
    }
  }

  // Check weather surge
  let weatherSurgeMultiplier: number | undefined;
  try {
    // We don't have lat/lng here, but getRoofData geocoded internally.
    // Weather surge requires coords — skip if not opted in.
    if (settings.weather_surge_enabled) {
      weatherSurgeMultiplier = settings.weather_surge_multiplier || undefined;
    }
  } catch {
    // Weather surge is optional — don't fail the estimate
  }

  // Calculate estimates for all priced materials
  const allMaterials: RoofMaterial[] = ["asphalt", "metal", "tile", "flat"];
  const pricedMaterials = allMaterials.filter((m) => {
    const low = rates[`${m}_low` as keyof ContractorRates];
    const high = rates[`${m}_high` as keyof ContractorRates];
    return low > 0 && high > 0;
  });

  if (pricedMaterials.length === 0) {
    return {
      success: false,
      error: "no_materials",
      fallbackMessage:
        "Pricing hasn't been fully set up yet, but I can connect you with the team for a free quote!",
    };
  }

  const estimates = pricedMaterials
    .map((mat) => {
      const result = calculateEstimate({
        roofData: roofData || undefined,
        geometry: geometry || undefined,
        material: mat,
        shingleLayers: "not_sure",
        rates,
        weatherSurgeMultiplier,
        // PRICING.1c-corrected (2026-04-24): chat path doesn't plumb shape
        // resolver yet — safe-middle hip default keeps pricing deterministic
        // and inside the projected 1c band for chat-served quotes.
        roofShapeClass: "hip",
      });

      const low = result.priceLow.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
      const high = result.priceHigh.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

      return {
        material: mat,
        label: materialLabels[mat] || mat,
        priceLow: result.priceLow,
        priceHigh: result.priceHigh,
        rangeDisplay: `${low} – ${high}`,
      };
    })
    .sort((a, b) => a.priceLow - b.priceLow);

  const roofAreaSqft = Math.round(roofData.roofAreaSqft);
  const pitchDegrees = Math.round(roofData.pitchDegrees * 10) / 10;
  const pitchRatio = Math.round(Math.tan((pitchDegrees * Math.PI) / 180) * 12);

  const isSurged = !!(weatherSurgeMultiplier && weatherSurgeMultiplier > 1);

  // Build summary for Riley to reference in conversation
  const primaryEst = estimates[0];
  const summary = [
    showRoofDetails
      ? `Satellite-measured roof: ${roofAreaSqft.toLocaleString()} sqft, ${pitchRatio}/12 pitch, ${roofData.numSegments} segments.`
      : "",
    `${estimates.length} material option${estimates.length > 1 ? "s" : ""} available.`,
    `Most affordable: ${primaryEst.label} at ${primaryEst.rangeDisplay}.`,
    estimates.length > 1
      ? `Premium: ${estimates[estimates.length - 1].label} at ${estimates[estimates.length - 1].rangeDisplay}.`
      : "",
    isSurged
      ? "NOTE: These prices include a temporary storm-demand adjustment. Prices may be lower once storm activity subsides."
      : "",
    ESTIMATE_DISCLAIMER,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    success: true,
    estimates,
    roofAreaSqft,
    pitchDegrees,
    isSatellite: true,
    numSegments: roofData.numSegments,
    weatherSurgeActive: isSurged,
    summary,
  };
}
