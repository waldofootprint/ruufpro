// ROI Calculator — shared logic for inline + standalone versions.
// Source: Vault 032 (Andy Steuer, WeLevel, $6B in exits — roofer example)

export interface ROIInputs {
  missedCallsPerWeek: number; // default 5
  avgJobValue: number;        // default 5000
  closeRate: number;          // default 30 (percentage)
}

export interface ROIOutputs {
  monthlyLost: number;
  yearlyLost: number;
  perCallValue: number;
  weeksOfProPaidFor: number; // how many weeks of Pro ($149/mo) the lost revenue covers
}

export function calculateROI(inputs: ROIInputs): ROIOutputs {
  const { missedCallsPerWeek, avgJobValue, closeRate } = inputs;
  // 85% of callers who can't reach you won't call back (industry stat)
  const lostLeadsPerWeek = missedCallsPerWeek * 0.85;
  const monthlyMissedCalls = lostLeadsPerWeek * 4.33;
  const convertedCalls = monthlyMissedCalls * (closeRate / 100);
  const monthlyLost = Math.round(convertedCalls * avgJobValue);
  const yearlyLost = monthlyLost * 12;
  const perCallValue = Math.round(avgJobValue * (closeRate / 100));
  const weeksOfProPaidFor = Math.round(monthlyLost / (149 / 4.33));

  return { monthlyLost, yearlyLost, perCallValue, weeksOfProPaidFor };
}

export const SLIDER_CONFIG = {
  missedCalls: { min: 1, max: 20, step: 1, default: 5 as number, label: "Missed calls per week" },
  jobValue: { min: 2000, max: 25000, step: 500, default: 5000 as number, label: "Average job value" },
  closeRate: { min: 10, max: 60, step: 5, default: 30 as number, label: "Close rate" },
};
