// Heat Score — composite lead scoring (1-100)
// Weights: widget engagement 35%, chat depth 20%, recency 15%, material switches 15%, affordability 10%, new homeowner 5%

interface HeatScoreInput {
  widgetViews: number;
  lastViewAt?: string | null;
  materialSwitches: number;
  chatDepthTier?: string | null; // "high_intent" | "engaged" | "browsing" | null
  lastActivityAt?: string | null;
  estimateHigh?: number | null;
  homeValue?: number | null;
  lastSaleDate?: string | null;
}

interface HeatScoreResult {
  score: number;
  tier: "hot" | "warm" | "cool";
}

export function calculateHeatScore(input: HeatScoreInput): HeatScoreResult {
  let score = 0;

  // Widget engagement (35 pts max)
  // 1 view = 5, 2 = 12, 3 = 20, 4+ = 28, recency bonus up to 7
  const viewScore = Math.min(input.widgetViews * 7, 28);
  const viewRecency = input.lastViewAt
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(input.lastViewAt).getTime()) / (24 * 60 * 60 * 1000)))
    : 0;
  score += viewScore + viewRecency;

  // Chat depth (20 pts max)
  if (input.chatDepthTier === "high_intent") score += 20;
  else if (input.chatDepthTier === "engaged") score += 12;
  else if (input.chatDepthTier === "browsing") score += 5;

  // Engagement recency (15 pts max)
  if (input.lastActivityAt) {
    const daysSince = (Date.now() - new Date(input.lastActivityAt).getTime()) / (24 * 60 * 60 * 1000);
    if (daysSince < 1) score += 15;
    else if (daysSince < 3) score += 10;
    else if (daysSince < 7) score += 5;
    else if (daysSince < 14) score += 2;
  }

  // Material switches (15 pts max)
  score += Math.min(input.materialSwitches * 5, 15);

  // Estimate-to-value affordability (10 pts max)
  if (input.estimateHigh && input.homeValue && input.homeValue > 0) {
    const ratio = input.estimateHigh / input.homeValue;
    if (ratio < 0.03) score += 10;
    else if (ratio < 0.05) score += 7;
    else if (ratio < 0.08) score += 4;
  }

  // New homeowner bonus (5 pts max)
  if (input.lastSaleDate) {
    const monthsSinceSale = (Date.now() - new Date(input.lastSaleDate).getTime()) / (30 * 24 * 60 * 60 * 1000);
    if (monthsSinceSale < 6) score += 5;
    else if (monthsSinceSale < 12) score += 3;
  }

  // Clamp to 1-100
  score = Math.max(1, Math.min(100, Math.round(score)));

  const tier = score >= 70 ? "hot" : score >= 40 ? "warm" : "cool";

  return { score, tier };
}
