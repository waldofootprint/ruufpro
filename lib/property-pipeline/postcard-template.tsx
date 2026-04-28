/**
 * Postcard template — step 4 baseline + step 6 legal floor wired (2026-04-26).
 *
 * Step 5 (creative direction) is parked pending Hannah's tone pick from
 * .tmp/postcard-mockup/index.html (12 tones explored). When step 5 lands,
 * the creative copy + branded design replaces the placeholder front headline,
 * but the §489.147(1)(a) disclosure block + half-rule font cap stay locked.
 *
 * Format: 6×11 standard-class. Bleed 11.25×6.25in (1125×625 px @ 100dpi).
 * Both sides return ready-to-send HTML strings for Lob's Postcards API.
 *
 * COMPLIANCE INVARIANT — read before changing anything:
 *  - The §489.147(1)(a) disclosure (DISCLOSURE_HTML) is verbatim and load-bearing.
 *  - DISCLOSURE_FONT_PX is the floor (12pt = 16px).
 *  - No font on either side may exceed MAX_OTHER_FONT_PX (32px), or the half-rule breaks.
 *  - Penalty for violation: $10K per piece against the roofer's license.
 */

const SIZE_BLEED_PX = { w: 1125, h: 625 };

export interface PostcardData {
  homeownerName?: string | null;
  propertyAddress: string;
  contractorBusinessName: string;
  contractorPhone: string;
  contractorLicenseNumber: string;
  qrShortCode: string;
  qrUrl: string;
  // Inline base64 PNG data URL for the QR image. Generated server-side at send
  // time so Lob's HTML→PDF renderer never has to reach a third-party host —
  // that fetch failing would ship a blank QR and silently kill the lead.
  qrDataUrl: string;
  optOutUrl: string;
  publicSiteUrl?: string;
}

// FL §489.147(1)(a) verbatim disclosure — three numbered statements REQUIRED on every
// roofing solicitation to a residential property owner, at font size ≥ 12pt AND ≥ half
// the largest font on the communication. Source: flsenate.gov/Laws/Statutes/2024/489.147
// fetched 2026-04-26. Penalty for prohibited advertisement: $10K/violation against the
// roofer's license.
//
// DO NOT paraphrase, abbreviate, or reorder. Verbatim is the compliance posture.
const SB76_DISCLOSURE_LINES: readonly string[] = [
  "1. The consumer is responsible for payment of any insurance deductible.",
  "2. It is insurance fraud punishable as a felony of the third degree for a contractor to knowingly or willfully, and with intent to injure, defraud, or deceive, pay, waive, or rebate all or part of an insurance deductible applicable to payment to the contractor for repairs to a property covered by a property insurance policy.",
  "3. It is insurance fraud punishable as a felony of the third degree to intentionally file an insurance claim containing any false, incomplete, or misleading information.",
];

// Half-rule constants. ANY font on EITHER side of the postcard counts toward "largest
// font size used in the communication" — the statute is communication-scoped, not
// side-scoped. Step 5 creative MUST keep the largest font ≤ MAX_OTHER_FONT_PX so the
// disclosure at DISCLOSURE_FONT_PX clears the half-rule.
const DISCLOSURE_FONT_PX = 16; // 12pt = 16px (1pt = 1.333px)
const MAX_OTHER_FONT_PX = 32; // 32px max → half = 16px = disclosure size, compliant
const DISCLOSURE_HTML = SB76_DISCLOSURE_LINES.map(escape).join("<br/>");

export function renderPostcardFront(data: PostcardData): string {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  @page { size: ${SIZE_BLEED_PX.w}px ${SIZE_BLEED_PX.h}px; margin: 0; }
  html, body { width: ${SIZE_BLEED_PX.w}px; height: ${SIZE_BLEED_PX.h}px; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: #f7f3ec; color: #1a1a1a; }
  .frame { box-sizing: border-box; width: 100%; height: 100%; padding: 80px 100px; display: flex; flex-direction: column; justify-content: space-between; }
  /* Step 5 creative: KEEP all fonts ≤ ${MAX_OTHER_FONT_PX}px so the §489.147(1)(a) disclosure
     at ${DISCLOSURE_FONT_PX}px (12pt) clears the "≥ half largest font" rule. */
  .eyebrow { font-size: 14px; letter-spacing: 0.18em; text-transform: uppercase; color: #b85c2a; font-weight: 700; }
  .headline { font-size: ${MAX_OTHER_FONT_PX}px; line-height: 1.1; font-weight: 800; max-width: 850px; }
  .sub { font-size: 18px; line-height: 1.4; max-width: 800px; margin-top: 16px; color: #333; }
  .roofer { font-size: 22px; font-weight: 700; }
  .small { font-size: 14px; color: #555; }
</style></head>
<body><div class="frame">
  <div>
    <div class="eyebrow">Florida Roof Check-In</div>
    <div class="headline">Your roof has stories. Let's see how it's holding up.</div>
    <div class="sub">Free 10-minute roof assessment from a licensed local contractor.</div>
  </div>
  <div>
    <div class="roofer">${escape(data.contractorBusinessName)}</div>
    <div class="small">FL License ${escape(data.contractorLicenseNumber)} · ${escape(data.contractorPhone)}</div>
  </div>
</div></body></html>`;
}

export function renderPostcardBack(data: PostcardData): string {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  @page { size: ${SIZE_BLEED_PX.w}px ${SIZE_BLEED_PX.h}px; margin: 0; }
  html, body { width: ${SIZE_BLEED_PX.w}px; height: ${SIZE_BLEED_PX.h}px; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: #ffffff; color: #1a1a1a; }
  .grid { box-sizing: border-box; width: 100%; height: 100%; padding: 60px 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  /* All fonts capped at ${MAX_OTHER_FONT_PX}px so disclosure at ${DISCLOSURE_FONT_PX}px (12pt) ≥ half-rule. */
  .left h2 { font-size: 24px; margin: 0 0 12px; }
  .left p { font-size: 16px; line-height: 1.4; margin: 0 0 10px; }
  .qr-block { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
  .qr-img { width: 280px; height: 280px; }
  .code { font-size: 22px; font-family: 'Courier New', monospace; letter-spacing: 0.12em; font-weight: 700; }
  .scan-cta { font-size: 18px; font-weight: 700; }
  .footer { grid-column: 1 / -1; border-top: 1px solid #888; padding-top: 14px; line-height: 1.4; color: #1a1a1a; }
  /* §489.147(1)(a) disclosure — DO NOT shrink. Floor: 12pt = ${DISCLOSURE_FONT_PX}px AND ≥ half largest font (${MAX_OTHER_FONT_PX/2}px). */
  .disclosure { font-size: ${DISCLOSURE_FONT_PX}px; font-weight: 700; line-height: 1.5; }
  .opt-out { font-size: 14px; margin-top: 8px; color: #444; }
  .indicia { position: absolute; top: 40px; right: 40px; border: 1px solid #888; padding: 12px 18px; font-size: 14px; }
</style></head>
<body>
<div class="indicia">PRSRT STD<br/>U.S. POSTAGE PAID<br/>LOB</div>
<div class="grid">
  <div class="left">
    <h2>Hi${data.homeownerName ? ` ${escape(data.homeownerName)}` : ""},</h2>
    <p>${escape(data.contractorBusinessName)} works homes near ${escape(data.propertyAddress)}.</p>
    <p>Scan the code → quick chat with our team about your roof. No phone tag. No pushy sales.</p>
    <p><strong>${escape(data.contractorBusinessName)}</strong><br/>FL License ${escape(data.contractorLicenseNumber)}<br/>${escape(data.contractorPhone)}</p>
  </div>
  <div class="qr-block">
    <img class="qr-img" src="${data.qrDataUrl}" alt="Scan to chat" />
    <div class="scan-cta">Scan or visit</div>
    <div class="code">${escape(data.qrShortCode)}</div>
    <div style="font-size:14px;color:#666;">ruufpro.com/m/${escape(data.qrShortCode)}</div>
  </div>
  <div class="footer">
    <div class="disclosure">${DISCLOSURE_HTML}</div>
    <div class="opt-out">To stop receiving mail from ${escape(data.contractorBusinessName)}, visit <strong>${escape(data.optOutUrl)}</strong> or text STOP. We honor opt-outs within 7 days.</div>
  </div>
</div>
</body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
