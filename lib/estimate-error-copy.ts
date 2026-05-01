// User-facing copy for each /api/estimate error_code, kept here so the
// widget (and any future surfaces consuming the API) can render the
// right message without duplicating string constants. Token {contractor}
// is replaced at call time with the roofer's display name.

export type EstimateErrorCode =
  | "setup_incomplete"
  | "commercial_or_high_rise"
  | "address_unrecognized"
  | "measurement_unavailable"
  | "pitch_conflict_recheck";

export type EstimateErrorCta = "manual_quote" | "retry_address" | "retry_pitch" | "contact" | null;

export type EstimateErrorCopy = {
  /** Short headline (~6 words). */
  headline: string;
  /** Full explanation (1-3 sentences). May reference {contractor}. */
  body: string;
  /** What the homeowner should do next. Drives which CTA the widget renders. */
  cta: EstimateErrorCta;
};

const COPY: Record<EstimateErrorCode, EstimateErrorCopy> = {
  setup_incomplete: {
    headline: "Online estimates aren't available right now",
    body: "{contractor} hasn't finished setting up online pricing. Submit your details and they'll get back to you with a quote.",
    cta: "manual_quote",
  },
  commercial_or_high_rise: {
    headline: "This looks like a commercial property",
    body: "Our online tool is built for residential roofs. {contractor} handles commercial and high-rise jobs by phone — please reach out directly for a custom quote.",
    cta: "contact",
  },
  address_unrecognized: {
    headline: "We couldn't find that address",
    body: "Double-check the spelling, or try the cross-streets. If the home is brand-new construction, online maps may not have caught up — submit your details and {contractor} will follow up.",
    cta: "retry_address",
  },
  measurement_unavailable: {
    headline: "We couldn't measure this roof from satellite",
    body: "Trees, complex roof shapes, or older imagery can make automatic measurement unreliable. {contractor} will visit the property for an exact quote — typically within 1-2 business days.",
    cta: "manual_quote",
  },
  pitch_conflict_recheck: {
    headline: "The pitch you picked doesn't match what we see",
    body: "Our satellite measurement suggests a different roof pitch. Take a quick look at your house and try again — or submit and we'll confirm pitch on-site.",
    cta: "retry_pitch",
  },
};

/**
 * Look up user-facing copy for an error_code. Falls back to a generic
 * "manual quote" message for unknown codes so a future API addition
 * doesn't crash old widgets.
 */
export function getEstimateErrorCopy(
  code: string | undefined,
  contractorName: string
): EstimateErrorCopy {
  const isKnown = code !== undefined && code in COPY;
  if (isKnown) {
    const c = COPY[code as EstimateErrorCode];
    return { ...c, body: c.body.replace("{contractor}", contractorName) };
  }
  return {
    headline: "We hit an unexpected snag",
    body: `Submit your details and ${contractorName} will follow up with a quote.`,
    cta: "manual_quote",
  };
}
