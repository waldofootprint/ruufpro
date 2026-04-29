// Shared SMS body generator for review requests.
// Used by /api/reviews/request (manual send), the review-prompt PWA card,
// and the review.push-prompt Inngest function.

export type ReviewSmsInputs = {
  customerName: string | null | undefined;
  businessName: string;
  googleReviewUrl: string;
};

export type ReviewSmsResult = {
  body: string;
  href: (phone: string) => string;
};

export function buildReviewSms({
  customerName,
  businessName,
  googleReviewUrl,
}: ReviewSmsInputs): ReviewSmsResult {
  const firstName = (customerName || "").split(" ")[0] || "there";
  const body = `Hey ${firstName}, thanks again for choosing ${businessName}! If you've got a minute, would you mind leaving us a quick Google review? ${googleReviewUrl}`;
  return {
    body,
    href: (phone: string) => `sms:${phone}&body=${encodeURIComponent(body)}`,
  };
}

export function firstNameOf(name: string | null | undefined): string {
  return (name || "").split(" ")[0] || "there";
}
