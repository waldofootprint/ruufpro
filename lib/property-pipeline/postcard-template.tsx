/**
 * Postcard template — 3D-Discovery v6 (decided 2026-04-28).
 *
 * Direction is locked in:
 *   - decisions/property-pipeline-mvp-source-of-truth.md (lines 79-108)
 *   - decisions/2026-04-28-pp-step5-creative-pivot-3d-discovery.md
 *
 * The postcard's job is to make the homeowner SCAN. The QR landing page is
 * the actual product (3D render of their home + neighborhood + storm count).
 * Postcard = curiosity tease. Don't blow the surprise.
 *
 * Four front headline variants ship; one back. Variants round-robin in
 * production until performance data picks the winner.
 *
 * Format: 6×11 standard-class. Bleed 11.25×6.25in (1125×625 px @ 100dpi).
 * Both sides return ready-to-send HTML strings for Lob's Postcards API.
 *
 * COMPLIANCE INVARIANTS — read before changing anything:
 *  - SB76_DISCLOSURE_LINES is verbatim §489.147(1)(a). Do NOT paraphrase.
 *  - DISCLOSURE_FONT_PX = 16 (12pt) is the floor.
 *  - No font on EITHER side may exceed MAX_OTHER_FONT_PX (32px), or the
 *    half-rule breaks ($10K/violation against the roofer's license).
 *  - License # must appear on both sides.
 *  - Opt-out URL line must appear on the back footer.
 *  - Per-home facts banned on the postcard (specific roof age / permit /
 *    year-built). Cohort/decade-level OK ("47 named storms since 2009").
 */

const SIZE_BLEED_PX = { w: 1125, h: 625 };

export type FrontVariant = "A" | "B" | "C" | "D";

export interface PostcardData {
  homeownerName?: string | null;
  propertyAddress: string;
  contractorBusinessName: string;
  contractorPhone: string;
  contractorLicenseNumber: string;
  /** Pre-formatted return-address string, e.g. "123 Main St · Bradenton FL 34211". */
  contractorMailingAddress?: string | null;
  qrShortCode: string;
  qrUrl: string;
  /**
   * Inline base64 PNG data URL for the QR image. Generated server-side at
   * send time so Lob's HTML→PDF renderer never has to reach a third-party
   * host — that fetch failing would ship a blank QR and silently kill the
   * lead.
   */
  qrDataUrl: string;
  optOutUrl: string;
  publicSiteUrl?: string;
}

export interface RenderOptions {
  /** Which of the four locked headlines to render. Defaults to "A". */
  variant?: FrontVariant;
}

// FL §489.147(1)(a) verbatim disclosure — three numbered statements REQUIRED on every
// roofing solicitation to a residential property owner, at font size ≥ 12pt AND ≥ half
// the largest font on the communication. Source: flsenate.gov/Laws/Statutes/2024/489.147
// fetched 2026-04-26.
//
// DO NOT paraphrase, abbreviate, or reorder. Verbatim is the compliance posture.
const SB76_DISCLOSURE_LINES: readonly string[] = [
  "1. The consumer is responsible for payment of any insurance deductible.",
  "2. It is insurance fraud punishable as a felony of the third degree for a contractor to knowingly or willfully, and with intent to injure, defraud, or deceive, pay, waive, or rebate all or part of an insurance deductible applicable to payment to the contractor for repairs to a property covered by a property insurance policy.",
  "3. It is insurance fraud punishable as a felony of the third degree to intentionally file an insurance claim containing any false, incomplete, or misleading information.",
];

// Half-rule constants. ANY font on EITHER side counts toward "largest font size used in
// the communication" — the statute is communication-scoped, not side-scoped. The whole
// design is built around the headline + short-code maxing at MAX_OTHER_FONT_PX so the
// disclosure at DISCLOSURE_FONT_PX clears the half-rule.
const DISCLOSURE_FONT_PX = 16; // 12pt = 16px (1pt = 1.333px)
const MAX_OTHER_FONT_PX = 32;  // 32px max → half = 16px = disclosure size, compliant
const DISCLOSURE_HTML = SB76_DISCLOSURE_LINES.map(escape).join("<br/>");

// Locked v6 copy (refined 2026-04-28 PM after Lead-Spy competitive read).
// Do NOT edit without re-reading source-of-truth lines 79-108 + the decision log
// at decisions/2026-04-28-pp-step5-creative-pivot-3d-discovery.md.
const HEADLINES: Record<FrontVariant, { headline: string; sub: string }> = {
  A: {
    headline: "47 named storms have hit Florida since 2009.",
    sub: "Most pre-2010 roofs have weathered every one of them. Scan for a free roof inspection — and a 3D look at your home, your roof's age, and how it stacks up on your block.",
  },
  B: {
    headline: "Public records suggest your roof hasn't been replaced in 20+ years.",
    sub: "That's when most Florida roofs start showing problems beneath the shingles. Scan for a free inspection — your home in 3D, your block's roof history, and storms survived.",
  },
  C: {
    headline: "Three roofs on your block were replaced last year. Was yours?",
    sub: "Scan for a free roof inspection — see your home in 3D, your roof's likely age, and where you land on your block.",
  },
  D: {
    headline: "We couldn't find a roof permit on your address.",
    sub: "Records this far back usually mean it's been 20+ years since the last replacement. Scan for a free roof inspection — your home in 3D, your roof's likely age, and how your block compares.",
  },
};

// Back trio — locked, question-led to invite the scan.
const BACK_QUESTIONS: readonly string[] = [
  "How old is your roof, really?",
  "How many storms has it been through?",
  "Whose roofs on your block have already been replaced?",
];

const BACK_TEASE_LEAD = "Three things you'll see when you scan:";

// Shared base styles. Editorial / document tone: cream paper, charcoal ink, terracotta
// accent on hairlines + numerals. Print-safe fonts only (Lob's HTML→PDF runs in a
// sandbox without web-font fetch).
const BASE_STYLES = `
  @page { size: ${SIZE_BLEED_PX.w}px ${SIZE_BLEED_PX.h}px; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    width: ${SIZE_BLEED_PX.w}px; height: ${SIZE_BLEED_PX.h}px;
    margin: 0; padding: 0;
    font-family: Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    -webkit-font-smoothing: antialiased;
  }
  .serif { font-family: Georgia, 'Times New Roman', serif; }
  .mono  { font-family: 'Courier New', Courier, monospace; }
  .ink     { color: #1a1a1a; }
  .ink-60  { color: rgba(26,26,26,0.62); }
  .ink-45  { color: rgba(26,26,26,0.45); }
  .accent  { color: #b85c2a; }
  .hr-accent { height: 2px; background: #b85c2a; border: 0; margin: 0; }
  .hr-ink    { height: 1px; background: rgba(26,26,26,0.15); border: 0; margin: 0; }
`;

export function renderPostcardFront(
  data: PostcardData,
  opts: RenderOptions = {}
): string {
  const variant: FrontVariant = opts.variant ?? "A";
  const { headline, sub } = HEADLINES[variant];

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body { background: #f7f3ec; }
  .frame { width: 100%; height: 100%; padding: 64px 80px 52px; display: flex; flex-direction: column; }
  .top-rule { display: flex; align-items: center; gap: 14px; }
  .top-rule .stripe { flex: 1; height: 2px; background: #b85c2a; }
  .top-rule .badge { font-family: 'Courier New', Courier, monospace; font-size: 11px; letter-spacing: 0.18em; color: #b85c2a; font-weight: 700; }
  .headline { font-size: ${MAX_OTHER_FONT_PX}px; line-height: 1.12; letter-spacing: -0.01em; max-width: 880px; margin-top: 36px; }
  .lede { font-size: 17px; line-height: 1.5; max-width: 780px; margin-top: 20px; }
  .spacer { flex: 1; }
  .foot-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; }
  .roofer-block { font-size: 14px; line-height: 1.5; }
  .roofer-name { font-size: 18px; font-weight: 700; letter-spacing: 0.02em; margin-bottom: 4px; }
  .stamp { border: 2px solid #b85c2a; padding: 12px 18px; text-align: center; font-family: 'Courier New', Courier, monospace; }
  .stamp-title { font-size: 14px; letter-spacing: 0.18em; font-weight: 700; color: #b85c2a; }
  .stamp-sub { font-size: 10px; letter-spacing: 0.16em; color: rgba(26,26,26,0.62); margin-top: 4px; }
</style></head>
<body>
<div class="frame">
  <div class="top-rule">
    <span class="stripe"></span>
    <span class="badge">FL · ${escape(variant)}</span>
    <span class="stripe"></span>
  </div>

  <h1 class="serif headline ink">${escape(headline)}</h1>
  <p class="lede ink-60">${escape(sub)}</p>

  <div class="spacer"></div>

  <hr class="hr-ink" />
  <div class="foot-row" style="margin-top:18px;">
    <div class="roofer-block">
      <div class="roofer-name">${escape(data.contractorBusinessName)}</div>
      <div class="ink-60">FL License ${escape(data.contractorLicenseNumber)}</div>
      <div class="ink-60">${escape(data.contractorPhone)}</div>
    </div>
    <div class="stamp">
      <div class="stamp-title">FREE ROOF INSPECTION</div>
      <div class="stamp-sub">NO CALL · NO PITCH · LICENSED FL ROOFER</div>
    </div>
  </div>
</div>
</body></html>`;
}

export function renderPostcardBack(data: PostcardData): string {
  const questionsHtml = BACK_QUESTIONS.map(
    (q, i) => `
    <div class="q-row">
      <div class="q-num serif accent">${String(i + 1).padStart(2, "0")}</div>
      <div class="q-text">${escape(q)}</div>
    </div>`
  ).join('<hr class="hr-ink q-rule" />');

  const returnAddr = data.contractorMailingAddress
    ? `<div class="return-addr ink-45">FROM · ${escape(data.contractorBusinessName)} · ${escape(data.contractorMailingAddress)}</div>`
    : `<div class="return-addr ink-45">FROM · ${escape(data.contractorBusinessName)}</div>`;

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body { background: #fdfbf6; position: relative; }
  .indicia { position: absolute; top: 32px; right: 36px; border: 1px solid rgba(26,26,26,0.45); padding: 10px 14px; font-size: 11px; line-height: 1.35; letter-spacing: 0.06em; text-align: center; font-family: 'Courier New', Courier, monospace; }
  .return-addr { font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 0.16em; padding: 28px 36px 0; }
  .grid { padding: 18px 80px 0; display: grid; grid-template-columns: 1.25fr 1fr; gap: 56px; }
  .intro { font-size: 14px; line-height: 1.5; margin-bottom: 16px; }
  .tease-lead { font-size: 13px; font-style: italic; margin-bottom: 6px; }
  .q-row { display: grid; grid-template-columns: 56px 1fr; gap: 14px; padding: 14px 0; align-items: baseline; }
  .q-num { font-size: 28px; line-height: 1; font-weight: 700; }
  .q-text { font-family: Georgia, 'Times New Roman', serif; font-size: 19px; line-height: 1.3; font-weight: 400; letter-spacing: -0.005em; }
  .q-rule { margin: 0; }
  .qr-block { padding-top: 4px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .qr-img { width: 240px; height: 240px; display: block; }
  .scan-line { font-size: 14px; font-weight: 700; margin-top: 14px; }
  .scan-sub { font-size: 12px; margin-top: 4px; font-style: italic; }
  .code { font-size: 30px; letter-spacing: 0.18em; font-weight: 700; margin-top: 14px; }
  .url { font-size: 12px; margin-top: 6px; }
  .footer { position: absolute; left: 80px; right: 80px; bottom: 28px; }
  /* §489.147(1)(a) disclosure — DO NOT shrink. Floor: 12pt = ${DISCLOSURE_FONT_PX}px AND ≥ half largest font (${MAX_OTHER_FONT_PX/2}px). */
  .disclosure { font-size: ${DISCLOSURE_FONT_PX}px; font-weight: 700; line-height: 1.45; }
  .opt-out { font-size: 12px; margin-top: 8px; }
</style></head>
<body>
<div class="indicia">PRSRT STD<br/>U.S. POSTAGE<br/>PAID<br/>LOB</div>
${returnAddr}
<div class="grid">
  <div class="left">
    <div class="intro ink">
      ${data.homeownerName ? `<strong>${escape(data.homeownerName)}</strong> — ` : ""}<strong>${escape(data.contractorBusinessName)}</strong> services homes around ${escape(data.propertyAddress)}.
    </div>
    <div class="tease-lead ink-60">${escape(BACK_TEASE_LEAD)}</div>
    ${questionsHtml}
  </div>
  <div class="qr-block">
    <img class="qr-img" src="${data.qrDataUrl}" alt="Scan for a free roof inspection" />
    <div class="scan-line">Scan for a free roof inspection.</div>
    <div class="scan-sub ink-60">Scan or visit</div>
    <div class="code mono">${escape(data.qrShortCode)}</div>
    <div class="url ink-60">ruufpro.com/m/${escape(data.qrShortCode)}</div>
  </div>
</div>
<div class="footer">
  <hr class="hr-ink" />
  <div class="disclosure" style="margin-top:10px;">${DISCLOSURE_HTML}</div>
  <div class="opt-out ink-60">To stop receiving mail from ${escape(data.contractorBusinessName)}, visit <strong>${escape(data.optOutUrl)}</strong> or text STOP. We honor opt-outs within 7 days.</div>
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
