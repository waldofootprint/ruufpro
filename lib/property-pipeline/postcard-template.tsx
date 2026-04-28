/**
 * Postcard template — two locked design directions, decided 2026-04-28 session 17.
 *
 * Direction lock context:
 *   - decisions/property-pipeline-mvp-source-of-truth.md (lines 79-108)
 *   - decisions/2026-04-28-pp-step5-creative-pivot-3d-discovery.md
 *   - .tmp/postcard-press-final/ (Press Bulletin design source)
 *   - .tmp/postcard-tool-final/  (Tool Catalog design source)
 *
 * Two variants ship; each owns its own front + back. Roofer picks one in
 * dashboard. Default = A (Press Bulletin).
 *
 *   A · PRESS BULLETIN — broadsheet newspaper aesthetic, charcoal metal
 *       roof macro on right half, masthead-and-rule grammar, ember accent.
 *   B · TOOL CATALOG    — DeWalt/Stanley industrial hardware aesthetic,
 *       black + safety yellow, diagonal stripe + crosshatch, vertical sidebar.
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
 *  - Web fonts NOT available in Lob's HTML→PDF sandbox. Use system stacks.
 *  - External images NOT reliably fetchable in Lob sandbox. Inline base64.
 */

import fs from "fs";
import path from "path";

const SIZE_BLEED_PX = { w: 1125, h: 625 };

export type FrontVariant = "A" | "B" | "C" | "D" | "E" | "F" | "G";

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
  /** Which variant to render. Defaults to "A". */
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
// the communication" — the statute is communication-scoped, not side-scoped.
const DISCLOSURE_FONT_PX = 16; // 12pt = 16px (1pt = 1.333px)
const MAX_OTHER_FONT_PX = 32;  // 32px max → half = 16px = disclosure size, compliant
const DISCLOSURE_HTML = SB76_DISCLOSURE_LINES.map(escape).join("<br/>");

// Locked copy — both variants share the same headline + body. The visual
// treatment is what differentiates them. Cohort numerals only (no per-home
// facts on the postcard; the QR landing handles per-home reveal).
const HEADLINE_LINES: readonly string[] = [
  "The worst",
  "roof damage is",
  "the kind you",
];
const HEADLINE_ACCENT = "don't see coming.";
const LEAD_LINE = "The average Florida hip roof is engineered for a 20-year service life.";
const BODY_LINE = `After year 15, failure begins beneath the surface — invisible until it isn't. {{NUM:47}} named storms since {{NUM:2008}}.`;
const BACK_TEASER_LINE = "Three minutes. Your phone. No call, no knock, no pitch.";

// Read postcard images from public/ at module load and inline as base64 data
// URLs. Lob's HTML→PDF sandbox doesn't reliably fetch external images, so
// every image must be inlined. Read-once at server start; cached for module
// life. Source files have been pre-resized + JPEG-recompressed so each comes
// in under 150KB to keep total HTML payload manageable.
function loadImage(filename: string): string {
  try {
    const p = path.join(process.cwd(), "public", "postcard", filename);
    const buf = fs.readFileSync(p);
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}
const METAL_JPG_DATA_URL: string = loadImage("metal.jpg");
const H2_JPG_DATA_URL: string = loadImage("h2.jpg");
const TILE_JPG_DATA_URL: string = loadImage("tile.jpg");
const H3A_JPG_DATA_URL: string = loadImage("h3a.jpg");
const H3B_JPG_DATA_URL: string = loadImage("h3b.jpg");
const H3C_JPG_DATA_URL: string = loadImage("h3c.jpg");

// Sandbox-safe font stacks. Anton/Big Shoulders → Impact stack;
// Newsreader → Georgia stack; Major Mono / IBM Plex Mono → Courier stack.
const STACK = {
  display: `Impact, "Helvetica Neue Bold Condensed", "Arial Narrow Bold", sans-serif`,
  serif: `Georgia, "Times New Roman", serif`,
  mono: `'Courier New', Courier, monospace`,
  sans: `Helvetica, Arial, sans-serif`,
  condensed: `"Arial Narrow", Helvetica, Arial, sans-serif`,
};

function renderBodyWithPullouts(body: string): string {
  const parts = body.split(/(\{\{NUM:\d+\}\})/g);
  return parts
    .map((part) => {
      const m = part.match(/^\{\{NUM:(\d+)\}\}$/);
      if (m) return `<span class="numeral">${escape(m[1])}</span>`;
      return escape(part);
    })
    .join("");
}

const BASE_STYLES = `
  @page { size: ${SIZE_BLEED_PX.w}px ${SIZE_BLEED_PX.h}px; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    width: ${SIZE_BLEED_PX.w}px; height: ${SIZE_BLEED_PX.h}px;
    margin: 0; padding: 0;
    -webkit-font-smoothing: antialiased;
  }
`;

// ===========================================================================
// VARIANT A · PRESS BULLETIN
// ===========================================================================

function renderPressFront(data: PostcardData): string {
  const headlineHtml = HEADLINE_LINES.map(escape).join("<br/>");
  const bodyHtml = renderBodyWithPullouts(BODY_LINE);
  const photoCss = METAL_JPG_DATA_URL
    ? `background-image: url("${METAL_JPG_DATA_URL}"); background-size: cover; background-position: 50% 35%;`
    : `background: linear-gradient(135deg, #2a2a2a 0%, #404040 100%);`;

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body { background: #d8d2c4; color: #100f0d; font-family: ${STACK.mono}; }
  .photo { position: absolute; right: 0; top: 0; bottom: 0; width: 50%; ${photoCss} }
  .photo::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(90deg, rgba(216,210,196,1) 0%, rgba(216,210,196,0) 14%);
  }
  .photo-cap {
    position: absolute; bottom: 36px; left: 38px; right: 38px;
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.34em;
    color: #d8d2c4; background: rgba(16,15,13,0.55); padding: 8px 10px;
    text-transform: uppercase;
  }
  .panel { position: absolute; top: 0; left: 0; bottom: 0; width: 56%; padding: 48px 44px 44px; }
  .masthead {
    border-top: 4px solid #100f0d; border-bottom: 1px solid #100f0d;
    padding: 9px 0; margin-bottom: 18px;
    display: flex; justify-content: space-between; align-items: baseline;
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.28em;
    color: #100f0d; text-transform: uppercase;
  }
  .masthead .name {
    font-family: ${STACK.display}; font-weight: 700; font-size: 22px;
    letter-spacing: 0.04em; line-height: 1; text-transform: uppercase;
  }
  .kicker {
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.28em;
    color: #b13d1a; margin-bottom: 10px; text-transform: uppercase;
  }
  h3 {
    font-family: ${STACK.display}; font-weight: 700;
    font-size: ${MAX_OTHER_FONT_PX}px; line-height: 0.98; margin: 0 0 8px;
    letter-spacing: 0.005em; text-transform: uppercase; color: #100f0d;
  }
  h3 .accent { color: #b13d1a; }
  .body {
    font-family: ${STACK.serif}; font-size: 14px; line-height: 1.5;
    color: #100f0d; max-width: 460px; margin-top: 14px;
  }
  .body .lead { font-style: italic; font-weight: 700; font-size: 15px; margin: 0 0 8px; }
  .body p { margin: 0 0 8px; }
  .body .numeral {
    font-family: ${STACK.display}; font-weight: 700; font-size: 17px;
    color: #b13d1a; padding: 0 2px; vertical-align: -1px;
  }
  .footer {
    position: absolute; bottom: 38px; left: 44px; right: 50%;
    border-top: 1px solid #100f0d; padding-top: 9px;
    display: flex; justify-content: space-between; align-items: flex-end;
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.22em;
    color: #100f0d; text-transform: uppercase;
  }
  .footer .biz {
    font-family: ${STACK.display}; font-weight: 700; font-size: 16px;
    letter-spacing: 0.04em; text-transform: uppercase;
  }
  .footer .meta { font-family: ${STACK.mono}; font-size: 9px; opacity: 0.75; margin-top: 4px; }
  .footer .seal { background: #100f0d; color: #d8d2c4; padding: 7px 11px; font-weight: 700; letter-spacing: 0.26em; }
</style></head>
<body>
<div class="photo"><div class="photo-cap">FIG. 1 — STANDING-SEAM · 14 YR FIELD SAMPLE · MANATEE CO</div></div>
<div class="panel">
  <div class="masthead">
    <span class="name">THE BULLETIN</span>
    <span>VOL XLVII · LATE EDITION · APR '26</span>
  </div>
  <div class="kicker">▸ STRUCTURAL NOTICE · ${escape(data.propertyAddress)}</div>
  <h3>${headlineHtml}<br/><span class="accent">${escape(HEADLINE_ACCENT)}</span></h3>
  <div class="body">
    <p class="lead">${escape(LEAD_LINE)}</p>
    <p>${bodyHtml}</p>
  </div>
  <div class="footer">
    <div>
      <div class="biz">${escape(data.contractorBusinessName)}</div>
      <div class="meta">FL LIC ${escape(data.contractorLicenseNumber)} · ${escape(data.contractorPhone)}</div>
    </div>
    <div class="seal">SCAN BACK ▶</div>
  </div>
</div>
</body></html>`;
}

function renderPressBack(data: PostcardData): string {
  const returnAddr = data.contractorMailingAddress
    ? `FROM · ${data.contractorBusinessName.toUpperCase()} · ${data.contractorMailingAddress.toUpperCase()}`
    : `FROM · ${data.contractorBusinessName.toUpperCase()}`;

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body { background: #d8d2c4; color: #100f0d; font-family: ${STACK.mono}; position: relative; }
  body::before {
    content: ""; position: absolute; inset: 0;
    background-image: repeating-linear-gradient(0deg, transparent 0 32px, rgba(0,0,0,0.018) 32px 33px);
    pointer-events: none;
  }
  .indicia {
    position: absolute; top: 28px; right: 36px; padding: 3px;
    border: 1.5px solid #100f0d; z-index: 3;
  }
  .indicia-inner {
    border: 1px solid #100f0d; padding: 7px 12px;
    font-family: ${STACK.mono}; font-size: 9px; line-height: 1.4;
    letter-spacing: 0.16em; text-align: center; text-transform: uppercase; font-weight: 700;
  }
  .return-addr {
    position: absolute; top: 32px; left: 36px;
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.22em;
    color: #100f0d; max-width: 360px; text-transform: uppercase;
  }
  .topbar {
    position: absolute; top: 92px; left: 36px; right: 36px;
    border-top: 4px solid #100f0d; border-bottom: 1px solid #100f0d;
    padding: 8px 0;
    display: flex; justify-content: space-between; align-items: baseline;
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.28em;
    color: #100f0d; text-transform: uppercase;
  }
  .topbar .name {
    font-family: ${STACK.display}; font-weight: 700; font-size: 22px;
    letter-spacing: 0.04em; text-transform: uppercase; line-height: 1;
  }
  .left {
    position: absolute; top: 156px; left: 36px; width: 460px;
    padding: 0 14px; text-align: center;
  }
  .micro-cap {
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.32em;
    color: #b13d1a; text-transform: uppercase; font-weight: 700; margin-bottom: 6px;
  }
  .teaser {
    font-family: ${STACK.serif}; font-style: italic; font-size: 16px;
    line-height: 1.35; color: #100f0d; max-width: 380px;
    margin: 0 auto 14px;
  }
  .qr-frame { position: relative; padding: 14px; width: 184px; margin: 0 auto; }
  .qr-corner { position: absolute; width: 24px; height: 24px; border: 2px solid #100f0d; }
  .qr-corner.tl { top: 0; left: 0; border-right: 0; border-bottom: 0; }
  .qr-corner.tr { top: 0; right: 0; border-left: 0; border-bottom: 0; }
  .qr-corner.bl { bottom: 0; left: 0; border-right: 0; border-top: 0; }
  .qr-corner.br { bottom: 0; right: 0; border-left: 0; border-top: 0; }
  .qr-corner::after { content: ""; position: absolute; width: 5px; height: 5px; background: #b13d1a; border-radius: 50%; }
  .qr-corner.tl::after { top: -3px; left: -3px; }
  .qr-corner.tr::after { top: -3px; right: -3px; }
  .qr-corner.bl::after { bottom: -3px; left: -3px; }
  .qr-corner.br::after { bottom: -3px; right: -3px; }
  .qr-img { width: 156px; height: 156px; display: block; }
  .scan-pill {
    display: inline-block; margin-top: 12px; padding: 7px 13px 6px;
    border: 1.5px solid #100f0d;
    font-family: ${STACK.display}; font-weight: 700; font-size: 13px;
    letter-spacing: 0.18em; color: #100f0d; text-transform: uppercase;
    background: rgba(16,15,13,0.04);
  }
  .signoff { margin-top: 16px; }
  .signoff .biz {
    font-family: ${STACK.display}; font-weight: 700; font-size: 22px;
    letter-spacing: 0.04em; line-height: 1; text-transform: uppercase;
  }
  .signoff .rule { width: 56px; height: 1px; background: #b13d1a; margin: 8px auto 0; }
  .signoff .meta {
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.18em;
    margin-top: 8px; line-height: 1.5; text-transform: uppercase;
  }
  .right {
    position: absolute; top: 168px; left: 530px; right: 36px; height: 200px;
    padding: 18px 22px; border: 1px dashed rgba(16,15,13,0.4);
  }
  .right .addr-tag {
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.32em;
    color: rgba(16,15,13,0.55); text-transform: uppercase; margin-bottom: 10px;
  }
  .right .addr {
    font-family: ${STACK.serif}; font-size: 15px; line-height: 1.5; color: #100f0d;
  }
  .right .addr .name {
    font-family: ${STACK.display}; font-weight: 700; font-size: 20px;
    letter-spacing: 0.02em; text-transform: uppercase; line-height: 1.1; margin-bottom: 4px;
  }
  .pull-strip {
    position: absolute; top: 388px; left: 530px; right: 36px;
    padding: 9px 16px;
    border-top: 1px solid #100f0d; border-bottom: 1px solid #100f0d;
    font-family: ${STACK.serif}; font-style: italic; font-size: 12.5px;
    line-height: 1.4; color: #100f0d;
  }
  .pull-strip strong {
    font-family: ${STACK.display}; font-weight: 700; font-style: normal;
    font-size: 13px; letter-spacing: 0.02em; color: #b13d1a; text-transform: uppercase;
  }
  .footer {
    position: absolute; left: 36px; right: 36px; bottom: 22px;
    border-top: 2px solid #100f0d; padding-top: 10px;
  }
  .disclosure {
    font-family: ${STACK.serif}; font-size: ${DISCLOSURE_FONT_PX}px; font-weight: 400;
    line-height: 1.32; color: rgba(16,15,13,0.92);
  }
  .opt-out {
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.16em;
    color: rgba(16,15,13,0.62); margin-top: 7px; text-transform: uppercase;
    display: flex; justify-content: space-between;
  }
  .opt-out strong { color: #b13d1a; font-weight: 700; }
</style></head>
<body>
<div class="indicia"><div class="indicia-inner">PRSRT STD<br/>U.S. POSTAGE<br/>PAID<br/>LOB</div></div>
<div class="return-addr">${escape(returnAddr)}</div>
<div class="topbar">
  <span class="name">THE BULLETIN</span>
  <span>VERSO · VOL XLVII · SCAN TO READ</span>
</div>
<div class="left">
  <div class="micro-cap">— ASSEMBLED BY YOUR ROOFER —</div>
  <div class="teaser">${escape(BACK_TEASER_LINE)}</div>
  <div class="qr-frame">
    <span class="qr-corner tl"></span><span class="qr-corner tr"></span>
    <span class="qr-corner bl"></span><span class="qr-corner br"></span>
    <img class="qr-img" src="${data.qrDataUrl}" alt="Scan for your free roof file" />
  </div>
  <div class="scan-pill">SCAN FOR YOUR FREE ROOF FILE</div>
  <div class="signoff">
    <div class="biz">${escape(data.contractorBusinessName)}</div>
    <div class="rule"></div>
    <div class="meta">FL LIC ${escape(data.contractorLicenseNumber)} · ${escape(data.contractorPhone)}</div>
  </div>
</div>
<div class="right">
  <div class="addr-tag">— ADDRESSED TO —</div>
  <div class="addr">
    <div class="name">CURRENT RESIDENT</div>
    <div>${escape(data.propertyAddress)}</div>
  </div>
</div>
<div class="pull-strip">
  <strong>YOUR HOME, IN 3D.</strong> Every named storm logged. Every permit on file (and the years without one). Scan, then close the tab — we will not call.
</div>
<div class="footer">
  <div class="disclosure">${DISCLOSURE_HTML}</div>
  <div class="opt-out">
    <span>FL LICENSE ${escape(data.contractorLicenseNumber)} · THIS IS AN ADVERTISEMENT</span>
    <span>TO STOP, VISIT <strong>${escape(data.optOutUrl)}</strong></span>
  </div>
</div>
</body></html>`;
}

// ===========================================================================
// VARIANT B · TOOL CATALOG
// ===========================================================================

function renderToolFront(data: PostcardData): string {
  const headlineHtml = HEADLINE_LINES.map(escape).join("<br/>");
  const bodyHtml = renderBodyWithPullouts(BODY_LINE);

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body { background: #1a1a1a; color: #fff; font-family: ${STACK.condensed}; }
  .stripe-bar {
    position: absolute; top: 0; bottom: 0; left: 0; width: 56px;
    background: #f5b014; display: flex; align-items: center; justify-content: center;
  }
  .stripe-bar .vert {
    writing-mode: vertical-rl; transform: rotate(180deg);
    font-family: ${STACK.display}; color: #1a1a1a; font-size: 14px;
    letter-spacing: 0.42em; font-weight: 700; text-transform: uppercase;
  }
  .diag {
    position: absolute; top: -40px; right: -100px;
    width: 360px; height: 700px; background: #f5b014;
    transform: rotate(15deg); opacity: 0.95; z-index: 1;
  }
  .diag::after {
    content: ""; position: absolute; inset: 0;
    background: repeating-linear-gradient(135deg, transparent 0 22px, rgba(0,0,0,0.07) 22px 24px);
  }
  .topline {
    position: absolute; top: 38px; left: 100px; right: 60px;
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.28em;
    color: #f5b014; z-index: 3; text-transform: uppercase; font-weight: 700;
  }
  .head { position: absolute; left: 100px; right: 60px; top: 80px; z-index: 3; }
  .head h3 {
    font-family: ${STACK.display}; font-weight: 700;
    font-size: ${MAX_OTHER_FONT_PX}px; line-height: 0.98; margin: 0;
    text-transform: uppercase; letter-spacing: 0.005em; color: #fff;
  }
  .head .h2 {
    font-family: ${STACK.display}; font-style: italic; font-weight: 700;
    font-size: ${MAX_OTHER_FONT_PX}px; line-height: 0.98; margin: 0;
    color: #f5b014; text-transform: uppercase; letter-spacing: 0.005em;
  }
  .body {
    position: absolute; left: 100px; right: 60px; bottom: 130px;
    font-family: ${STACK.condensed}; font-size: 14px; line-height: 1.5;
    max-width: 720px; z-index: 3; color: #fff;
  }
  .body .lead { font-weight: 700; font-size: 15px; margin: 0 0 6px; }
  .body p { margin: 0 0 5px; }
  .body .numeral {
    font-family: ${STACK.display}; font-weight: 700; color: #f5b014;
    font-size: 22px; vertical-align: -2px; padding: 0 2px;
  }
  .sku {
    position: absolute; right: 60px; top: 86px;
    font-family: ${STACK.mono}; color: #1a1a1a; font-size: 10px;
    letter-spacing: 0.18em; line-height: 1.7; z-index: 3;
    text-align: right; font-weight: 700; text-transform: uppercase;
  }
  .sku .big {
    font-family: ${STACK.display}; font-size: 28px; letter-spacing: 0;
    display: block; margin-bottom: 4px;
  }
  .footer {
    position: absolute; left: 100px; right: 60px; bottom: 38px;
    display: flex; justify-content: space-between; align-items: flex-end; z-index: 3;
  }
  .footer .name {
    font-family: ${STACK.display}; font-weight: 700; font-size: 22px;
    letter-spacing: 0.02em; text-transform: uppercase;
  }
  .footer .meta {
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.18em;
    opacity: 0.78; margin-top: 4px; text-transform: uppercase;
  }
  .footer .badge {
    background: #f5b014; color: #1a1a1a; padding: 9px 14px;
    font-family: ${STACK.display}; font-weight: 700; font-size: 14px;
    letter-spacing: 0.18em; text-transform: uppercase;
  }
</style></head>
<body>
<div class="diag"></div>
<div class="stripe-bar"><span class="vert">FLORIDA · 2026 · NOTICE</span></div>
<div class="topline">SERIES A · MANATEE EDITION · ROOFING NOTICE</div>
<div class="head">
  <h3>${headlineHtml}</h3>
  <div class="h2">${escape(HEADLINE_ACCENT)}</div>
</div>
<div class="sku">
  <span class="big">FREE</span>
  ROOF INSPECTION<br/>
  NO CALL · NO PITCH<br/>
  FL LICENSED ROOFER
</div>
<div class="body">
  <p class="lead">${escape(LEAD_LINE)}</p>
  <p>${bodyHtml}</p>
</div>
<div class="footer">
  <div>
    <div class="name">${escape(data.contractorBusinessName)}</div>
    <div class="meta">FL LIC ${escape(data.contractorLicenseNumber)} · ${escape(data.contractorPhone)}</div>
  </div>
  <div class="badge">SCAN BACK ▶</div>
</div>
</body></html>`;
}

function renderToolBack(data: PostcardData): string {
  const returnAddr = data.contractorMailingAddress
    ? `FROM · ${data.contractorBusinessName.toUpperCase()} · ${data.contractorMailingAddress.toUpperCase()}`
    : `FROM · ${data.contractorBusinessName.toUpperCase()}`;

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body { background: #1a1a1a; color: #fff; font-family: ${STACK.condensed}; }
  .hazard-top {
    position: absolute; top: 0; left: 0; right: 0; height: 16px;
    background: repeating-linear-gradient(135deg, #f5b014 0 14px, #1a1a1a 14px 28px);
    z-index: 4;
  }
  .indicia {
    position: absolute; top: 38px; right: 36px; padding: 3px;
    border: 2px solid #f5b014; z-index: 5;
  }
  .indicia-inner {
    border: 1px solid #f5b014; padding: 7px 12px;
    font-family: ${STACK.mono}; font-size: 9px; line-height: 1.4;
    letter-spacing: 0.16em; text-align: center; text-transform: uppercase;
    font-weight: 700; color: #f5b014;
  }
  .return-addr {
    position: absolute; top: 42px; left: 36px;
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.22em;
    color: #f5b014; max-width: 360px; text-transform: uppercase; font-weight: 700;
    z-index: 5;
  }
  .topbar {
    position: absolute; top: 100px; left: 36px; right: 36px;
    border-top: 3px solid #f5b014; border-bottom: 1px solid #f5b014;
    padding: 8px 0;
    display: flex; justify-content: space-between; align-items: baseline;
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.28em;
    color: #f5b014; text-transform: uppercase; font-weight: 700;
  }
  .topbar .name {
    font-family: ${STACK.display}; font-weight: 700; font-size: 22px;
    letter-spacing: 0.04em; line-height: 1; color: #f5b014;
  }
  .left {
    position: absolute; top: 162px; left: 36px; width: 460px;
    padding: 0 14px; text-align: center;
  }
  .micro-cap {
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.32em;
    color: #f5b014; text-transform: uppercase; font-weight: 700; margin-bottom: 8px;
  }
  .teaser {
    font-family: ${STACK.condensed}; font-weight: 500; font-size: 15px;
    line-height: 1.4; color: #fff; max-width: 380px; margin: 0 auto 14px;
  }
  .teaser em { font-style: italic; color: #f5b014; }
  .qr-frame { position: relative; padding: 14px; width: 184px; margin: 0 auto; }
  .qr-corner { position: absolute; width: 24px; height: 24px; border: 2px solid #f5b014; }
  .qr-corner.tl { top: 0; left: 0; border-right: 0; border-bottom: 0; }
  .qr-corner.tr { top: 0; right: 0; border-left: 0; border-bottom: 0; }
  .qr-corner.bl { bottom: 0; left: 0; border-right: 0; border-top: 0; }
  .qr-corner.br { bottom: 0; right: 0; border-left: 0; border-top: 0; }
  .qr-corner::after { content: ""; position: absolute; width: 6px; height: 6px; background: #f5b014; }
  .qr-corner.tl::after { top: -3px; left: -3px; }
  .qr-corner.tr::after { top: -3px; right: -3px; }
  .qr-corner.bl::after { bottom: -3px; left: -3px; }
  .qr-corner.br::after { bottom: -3px; right: -3px; }
  .qr-img { width: 156px; height: 156px; display: block; background: #fff; padding: 6px; }
  .scan-pill {
    display: inline-block; margin-top: 12px; padding: 9px 14px 8px;
    background: #f5b014; color: #1a1a1a;
    font-family: ${STACK.display}; font-weight: 700; font-size: 14px;
    letter-spacing: 0.18em; text-transform: uppercase;
  }
  .signoff { margin-top: 14px; }
  .signoff .biz {
    font-family: ${STACK.display}; font-weight: 700; font-size: 22px;
    letter-spacing: 0.04em; line-height: 1; text-transform: uppercase; color: #fff;
  }
  .signoff .rule { width: 56px; height: 2px; background: #f5b014; margin: 8px auto 0; }
  .signoff .meta {
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.18em;
    margin-top: 8px; line-height: 1.5; opacity: 0.85; text-transform: uppercase; color: #fff;
  }
  .right {
    position: absolute; top: 168px; left: 530px; right: 36px; height: 200px;
    padding: 18px 22px; border: 2px dashed #f5b014;
  }
  .right .addr-tag {
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.32em;
    color: #f5b014; text-transform: uppercase; font-weight: 700; margin-bottom: 12px;
  }
  .right .addr {
    font-family: ${STACK.condensed}; font-size: 16px; line-height: 1.5; color: #fff;
  }
  .right .addr .name {
    font-family: ${STACK.display}; font-weight: 700; font-size: 22px;
    letter-spacing: 0.02em; text-transform: uppercase; line-height: 1.1; margin-bottom: 4px;
  }
  .pull-strip {
    position: absolute; top: 388px; left: 530px; right: 36px;
    padding: 9px 16px; background: #f5b014; color: #1a1a1a;
    font-family: ${STACK.condensed}; font-weight: 700;
    font-size: 12.5px; line-height: 1.4;
  }
  .pull-strip strong {
    font-family: ${STACK.display}; font-weight: 700; font-size: 13px;
    letter-spacing: 0.02em; text-transform: uppercase;
  }
  .footer {
    position: absolute; left: 0; right: 0; bottom: 0;
    background: #f1ede2; color: #1a1a1a;
    padding: 12px 36px 14px; border-top: 4px solid #f5b014;
  }
  .disclosure {
    font-family: ${STACK.serif}; font-size: ${DISCLOSURE_FONT_PX}px; font-weight: 400;
    line-height: 1.32; color: #1a1a1a;
  }
  .opt-out {
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.18em;
    color: rgba(26,26,26,0.7); margin-top: 8px; text-transform: uppercase;
    font-weight: 700; display: flex; justify-content: space-between;
    border-top: 1px solid rgba(26,26,26,0.25); padding-top: 7px;
  }
  .opt-out strong { color: #1a1a1a; }
</style></head>
<body>
<div class="hazard-top"></div>
<div class="indicia"><div class="indicia-inner">PRSRT STD<br/>U.S. POSTAGE<br/>PAID<br/>LOB</div></div>
<div class="return-addr">${escape(returnAddr)}</div>
<div class="topbar">
  <span class="name">SERIES A</span>
  <span>VERSO · MANATEE EDITION · SCAN TO READ</span>
</div>
<div class="left">
  <div class="micro-cap">— ASSEMBLED BY YOUR ROOFER —</div>
  <div class="teaser">Three minutes. Your phone. <em>No call, no knock, no pitch.</em></div>
  <div class="qr-frame">
    <span class="qr-corner tl"></span><span class="qr-corner tr"></span>
    <span class="qr-corner bl"></span><span class="qr-corner br"></span>
    <img class="qr-img" src="${data.qrDataUrl}" alt="Scan for your free roof file" />
  </div>
  <div class="scan-pill">SCAN FOR YOUR FREE ROOF FILE</div>
  <div class="signoff">
    <div class="biz">${escape(data.contractorBusinessName)}</div>
    <div class="rule"></div>
    <div class="meta">FL LIC ${escape(data.contractorLicenseNumber)} · ${escape(data.contractorPhone)}</div>
  </div>
</div>
<div class="right">
  <div class="addr-tag">▸ ADDRESSED TO</div>
  <div class="addr">
    <div class="name">CURRENT RESIDENT</div>
    <div>${escape(data.propertyAddress)}</div>
  </div>
</div>
<div class="pull-strip">
  <strong>YOUR HOME, IN 3D.</strong> Every named storm logged. Every permit on file (and the years without one). Scan, then close the tab — we will not call.
</div>
<div class="footer">
  <div class="disclosure">${DISCLOSURE_HTML}</div>
  <div class="opt-out">
    <span>FL LICENSE ${escape(data.contractorLicenseNumber)} · THIS IS AN ADVERTISEMENT</span>
    <span>TO STOP, VISIT <strong>${escape(data.optOutUrl)}</strong></span>
  </div>
</div>
</body></html>`;
}

// ===========================================================================
// VARIANT C · MATERIAL CATALOG (front only — back TBD)
// ===========================================================================

function renderMaterialFront(data: PostcardData): string {
  const headlineHtml = HEADLINE_LINES.map(escape).join("<br/>");
  const bodyHtml = renderBodyWithPullouts(BODY_LINE);
  const swatch = (img: string, sku: string, fig: string, name: string, life: string, fail: string, bg: string) => `
    <div class="swatch" style="background:${bg};">
      <div class="sku-row"><span>SKU · ${sku}</span><span>FIG. ${fig}</span></div>
      <div class="img" style="background-image:url('${img}');"></div>
      <div class="mat">${name}</div>
      <div class="stat"><span>LIFESPAN</span><span class="v">${life}</span></div>
      <div class="stat"><span>FL FAIL MODE</span><span class="v">${fail}</span></div>
    </div>`;

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body { background: #ece5d3; color: #1a1612; font-family: ${STACK.mono}; position: relative; }
  body::before {
    content: ""; position: absolute; inset: 0;
    background-image: repeating-linear-gradient(0deg, transparent 0 36px, rgba(0,0,0,0.025) 36px 37px);
    pointer-events: none;
  }
  .topbar {
    position: absolute; top: 0; left: 0; right: 0; height: 52px;
    background: #1a1612; color: #ece5d3;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 50px;
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.32em;
    font-weight: 700; text-transform: uppercase;
  }
  .topbar .vol {
    font-family: ${STACK.display}; font-size: 18px;
    letter-spacing: 0.06em; color: #ece5d3; font-weight: 700;
  }
  .head { position: absolute; top: 76px; left: 50px; right: 50px; }
  .kicker {
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.32em;
    color: #8a4a1f; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;
  }
  h3 {
    font-family: ${STACK.display}; font-weight: 700;
    font-size: ${MAX_OTHER_FONT_PX}px; line-height: 0.98; margin: 0;
    letter-spacing: 0.005em; text-transform: uppercase; color: #1a1612;
  }
  h3 em {
    font-family: ${STACK.serif}; font-style: italic; font-weight: 700;
    color: #8a4a1f; letter-spacing: -0.005em; text-transform: none;
  }
  .swatches {
    position: absolute; top: 196px; left: 50px; right: 50px;
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
  }
  .swatch {
    background: #fff; border: 1px solid #1a1612;
    padding: 11px 13px 13px;
    box-shadow: 4px 4px 0 #1a1612;
    position: relative;
  }
  .swatch .sku-row {
    display: flex; justify-content: space-between;
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.22em;
    color: #5a4a36; margin-bottom: 7px; font-weight: 700;
  }
  .swatch .img {
    height: 110px; background-size: contain;
    background-position: center; background-repeat: no-repeat;
  }
  .swatch .mat {
    font-family: ${STACK.display}; font-weight: 700; font-size: 19px;
    letter-spacing: 0.04em; text-transform: uppercase; color: #1a1612; margin-top: 7px;
  }
  .swatch .stat {
    display: flex; justify-content: space-between;
    margin-top: 7px; padding-top: 7px;
    border-top: 1px dashed rgba(26,22,18,0.4);
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.16em;
    text-transform: uppercase; font-weight: 700;
  }
  .swatch .stat .v { font-family: ${STACK.display}; font-size: 12px; letter-spacing: 0.04em; }
  .body {
    position: absolute; bottom: 76px; left: 50px; right: 50px;
    font-family: ${STACK.mono}; font-size: 12px; line-height: 1.5;
    color: #1a1612; border-top: 1px solid #1a1612; padding-top: 10px;
    display: flex; justify-content: space-between; gap: 28px;
  }
  .body .col { flex: 1; max-width: 580px; }
  .body .col p { margin: 0; }
  .body .lead { font-weight: 700; margin-bottom: 4px; }
  .body .numeral {
    font-family: ${STACK.display}; font-weight: 700; color: #8a4a1f;
    font-size: 15px; padding: 0 2px; vertical-align: -1px;
  }
  .body .pull {
    text-align: right;
    font-family: ${STACK.serif}; font-style: italic; font-weight: 700;
    font-size: 16px; line-height: 1.2; color: #8a4a1f; max-width: 240px;
  }
  .footer {
    position: absolute; bottom: 22px; left: 50px; right: 50px;
    display: flex; justify-content: space-between; align-items: flex-end;
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.22em;
    color: #1a1612; text-transform: uppercase;
  }
  .footer .biz {
    font-family: ${STACK.display}; font-weight: 700; font-size: 16px;
    letter-spacing: 0.04em; text-transform: uppercase;
  }
  .footer .meta { color: rgba(26,22,18,0.6); margin-top: 4px; }
  .footer .seal {
    background: #1a1612; color: #ece5d3; padding: 8px 12px;
    font-weight: 700; letter-spacing: 0.24em;
  }
</style></head>
<body>
<div class="topbar">
  <span>RUUF · MATERIAL CATALOG</span>
  <span class="vol">VOL. 47 · MANATEE EDITION</span>
  <span>2026 · FREE COPY</span>
</div>
<div class="head">
  <div class="kicker">▸ A NOTICE FOR ${escape(data.propertyAddress.toUpperCase())}</div>
  <h3>${headlineHtml} <em>${escape(HEADLINE_ACCENT)}</em></h3>
</div>
<div class="swatches">
  ${swatch(H3A_JPG_DATA_URL, "002", "A", "Slate", "75-100 YR", "FASTENERS", "#fff")}
  ${swatch(H3B_JPG_DATA_URL, "014", "B", "Clay Tile", "50 YR", "UNDERLAYMENT", "#fff7ee")}
  ${swatch(H3C_JPG_DATA_URL, "028", "C", "Asphalt", "15-20 YR", "GRANULE LOSS", "#f4f0e6")}
</div>
<div class="body">
  <div class="col">
    <p class="lead">${escape(LEAD_LINE)}</p>
    <p>${bodyHtml}</p>
  </div>
  <div class="pull">Scan for your free assessment.</div>
</div>
<div class="footer">
  <div>
    <div class="biz">${escape(data.contractorBusinessName)}</div>
    <div class="meta">FL LIC ${escape(data.contractorLicenseNumber)} · ${escape(data.contractorPhone)}</div>
  </div>
  <div class="seal">SCAN BACK ▶</div>
</div>
</body></html>`;
}

// ===========================================================================
// VARIANT D · FORENSIC SPECIMEN (front only — back TBD)
// ===========================================================================

function renderForensicFront(data: PostcardData): string {
  const headlineHtml = HEADLINE_LINES.map(escape).join("<br/>");
  const bodyHtml = renderBodyWithPullouts(BODY_LINE);
  const photoCss = H2_JPG_DATA_URL
    ? `background-image: url("${H2_JPG_DATA_URL}");`
    : `background: #b8b9b3;`;

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body { background: #e8e6e0; color: #14171c; font-family: ${STACK.mono}; position: relative; }
  body::before {
    content: ""; position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px);
    background-size: 28px 28px; pointer-events: none;
  }
  .frame { position: absolute; top: 28px; left: 28px; right: 28px; bottom: 28px; border: 1px solid #14171c; }
  .corners { position: absolute; width: 14px; height: 14px; border-color: #14171c; border-style: solid; }
  .corners.tl { top: 22px; left: 22px; border-width: 2px 0 0 2px; }
  .corners.tr { top: 22px; right: 22px; border-width: 2px 2px 0 0; }
  .corners.bl { bottom: 22px; left: 22px; border-width: 0 0 2px 2px; }
  .corners.br { bottom: 22px; right: 22px; border-width: 0 2px 2px 0; }
  .topline {
    position: absolute; top: 56px; left: 70px; right: 70px;
    display: flex; justify-content: space-between;
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.28em;
    color: #14171c; text-transform: uppercase; font-weight: 700;
  }
  .file-tag { background: #14171c; color: #e8e6e0; padding: 5px 11px; }
  .specimen-box {
    position: absolute; top: 96px; left: 70px; width: 520px; height: 380px;
    background: #fff; border: 1px solid #14171c;
    box-shadow: 0 1px 0 #14171c, 0 14px 24px rgba(0,0,0,0.08);
  }
  .specimen-img {
    position: absolute; inset: 14px;
    ${photoCss}
    background-size: contain; background-position: center; background-repeat: no-repeat;
  }
  .specimen-tag {
    position: absolute; bottom: 14px; left: 14px; right: 14px;
    border-top: 1px solid #14171c; padding-top: 9px;
    display: flex; justify-content: space-between;
    font-family: ${STACK.mono}; font-size: 9px; letter-spacing: 0.22em;
    color: #14171c; text-transform: uppercase; font-weight: 700;
  }
  .data { position: absolute; top: 96px; right: 70px; width: 360px; }
  .data .kicker {
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.32em;
    color: #5b6470; margin-bottom: 12px; text-transform: uppercase; font-weight: 700;
  }
  .data h3 {
    font-family: ${STACK.serif}; font-weight: 700; font-style: italic;
    font-size: ${MAX_OTHER_FONT_PX}px; line-height: 1; margin: 0 0 18px;
    letter-spacing: -0.005em; color: #14171c;
  }
  .data h3 em { color: #4a6f8e; font-style: italic; }
  .row {
    display: flex; justify-content: space-between; align-items: baseline;
    border-bottom: 1px solid rgba(20,23,28,0.35);
    padding: 8px 0;
    font-family: ${STACK.mono}; font-size: 10px;
    letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700;
  }
  .row:last-child { border-bottom: 0; }
  .row .l { color: #5b6470; }
  .row .v {
    font-family: ${STACK.serif}; font-style: italic;
    font-size: 16px; letter-spacing: 0; color: #14171c; font-weight: 700;
  }
  .row .v.warn { color: #c44d2a; }
  .body {
    position: absolute; bottom: 88px; left: 70px; right: 70px;
    font-family: ${STACK.serif}; font-style: italic; font-size: 15px;
    line-height: 1.5; color: #14171c;
  }
  .body .lead { font-weight: 700; }
  .body strong {
    font-style: normal; font-family: ${STACK.mono}; font-weight: 700;
    font-size: 12px; color: #4a6f8e; padding: 0 2px; text-transform: uppercase; letter-spacing: 0.18em;
  }
  .body .numeral {
    font-style: normal; font-family: ${STACK.display}; font-weight: 700;
    color: #c44d2a; font-size: 17px; padding: 0 2px; vertical-align: -1px;
  }
  .footer {
    position: absolute; bottom: 38px; left: 70px; right: 70px;
    display: flex; justify-content: space-between; align-items: flex-end;
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.22em;
    color: #14171c; text-transform: uppercase;
  }
  .footer .biz {
    font-family: ${STACK.serif}; font-style: italic; font-weight: 700;
    font-size: 19px; letter-spacing: 0;
  }
  .footer .meta { color: rgba(20,23,28,0.6); margin-top: 4px; font-weight: 700; }
  .footer .seal {
    background: #14171c; color: #e8e6e0; padding: 8px 12px;
    font-weight: 700; letter-spacing: 0.24em;
  }
</style></head>
<body>
<div class="frame"></div>
<div class="corners tl"></div><div class="corners tr"></div>
<div class="corners bl"></div><div class="corners br"></div>
<div class="topline">
  <span class="file-tag">FILE · CASE 8734</span>
  <span>FLORIDA · MANATEE COUNTY · 2026</span>
</div>
<div class="specimen-box">
  <div class="specimen-img"></div>
  <div class="specimen-tag">
    <span>EXHIBIT A · SUBJECT STRUCTURE</span>
    <span>SCALE 1:240</span>
  </div>
</div>
<div class="data">
  <div class="kicker">▸ ASSESSMENT SUMMARY</div>
  <h3>${headlineHtml}<br/><em>${escape(HEADLINE_ACCENT)}</em></h3>
  <div class="row"><span class="l">PERMIT GAP</span><span class="v warn">{X} YRS</span></div>
  <div class="row"><span class="l">NAMED STORMS · NOAA</span><span class="v">47</span></div>
  <div class="row"><span class="l">UV EXPOSURE</span><span class="v">15+ YRS</span></div>
  <div class="row"><span class="l">SUBSURFACE LOOK</span><span class="v warn">NONE</span></div>
  <div class="row"><span class="l">ASSESSMENT</span><span class="v">FREE</span></div>
</div>
<div class="body">
  <span class="lead">${escape(LEAD_LINE)}</span> ${bodyHtml}
</div>
<div class="footer">
  <div>
    <div class="biz">${escape(data.contractorBusinessName)}</div>
    <div class="meta">FL LIC ${escape(data.contractorLicenseNumber)} · ${escape(data.contractorPhone)}</div>
  </div>
  <div class="seal">SCAN BACK ▶</div>
</div>
</body></html>`;
}

// ===========================================================================
// VARIANT E · ITALIAN EDITORIAL (front only — back TBD)
// ===========================================================================

function renderEditorialFront(data: PostcardData): string {
  const headlineHtml = HEADLINE_LINES.map(escape).join("<br/>");
  const bodyHtml = renderBodyWithPullouts(BODY_LINE);
  const photoCss = TILE_JPG_DATA_URL
    ? `background-image: url("${TILE_JPG_DATA_URL}"); background-size: cover; background-position: 50% 60%;`
    : `background: linear-gradient(135deg, #8a4a1f 0%, #c66a2e 100%);`;

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body { background: #1a1108; color: #f3e8d2; font-family: ${STACK.sans}; position: relative; }
  .photo {
    position: absolute; inset: 0; ${photoCss}
    filter: contrast(1.05) saturate(1.08) brightness(0.96);
  }
  .photo::after {
    content: ""; position: absolute; inset: 0;
    background:
      linear-gradient(180deg, rgba(26,17,8,0) 30%, rgba(26,17,8,0.55) 100%),
      linear-gradient(90deg, rgba(26,17,8,0.45) 0%, transparent 35%);
  }
  .masthead {
    position: absolute; top: 36px; left: 50px; right: 50px;
    display: flex; justify-content: space-between; align-items: baseline;
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.32em;
    color: #f3e8d2; text-transform: uppercase; font-weight: 700;
  }
  .masthead .vol {
    font-family: ${STACK.serif}; font-style: italic; font-weight: 700;
    font-size: 26px; line-height: 1; letter-spacing: -0.02em; color: #f3e8d2;
  }
  .masthead .issue { color: #e6a35a; }
  .head { position: absolute; top: 92px; left: 50px; right: 50px; }
  .head .kicker {
    font-family: ${STACK.display}; font-weight: 700; font-size: 11px;
    letter-spacing: 0.42em; color: #e6a35a; margin-bottom: 12px; text-transform: uppercase;
  }
  .head h3 {
    font-family: ${STACK.serif}; font-weight: 700; font-style: italic;
    font-size: ${MAX_OTHER_FONT_PX}px; line-height: 1; margin: 0;
    letter-spacing: -0.01em; color: #f3e8d2;
    text-shadow: 0 4px 24px rgba(0,0,0,0.4);
  }
  .head h3 em { color: #e6a35a; font-style: italic; }
  .pull {
    position: absolute; left: 50px; bottom: 168px;
    font-family: ${STACK.serif}; font-style: italic; font-weight: 400;
    font-size: 17px; line-height: 1.4; color: #f3e8d2;
    max-width: 540px; text-shadow: 0 1px 8px rgba(0,0,0,0.5);
  }
  .body {
    position: absolute; left: 50px; right: 50px; bottom: 110px;
    font-family: ${STACK.serif}; font-size: 14px; line-height: 1.5;
    color: #f3e8d2; max-width: 720px;
    text-shadow: 0 1px 6px rgba(0,0,0,0.5);
  }
  .body .lead { font-style: italic; font-weight: 700; font-size: 15px; margin: 0 0 6px; }
  .body p { margin: 0 0 4px; }
  .body .numeral {
    font-family: ${STACK.serif}; font-style: italic; font-weight: 700;
    color: #e6a35a; font-size: 18px; padding: 0 2px;
  }
  .footer {
    position: absolute; bottom: 38px; left: 50px; right: 50px;
    display: flex; justify-content: space-between; align-items: flex-end;
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.24em;
    color: #f3e8d2; text-transform: uppercase; font-weight: 700;
  }
  .footer .biz {
    font-family: ${STACK.serif}; font-style: italic; font-weight: 700;
    font-size: 20px; letter-spacing: -0.005em;
  }
  .footer .meta { color: rgba(243,232,210,0.7); margin-top: 4px; }
  .footer .seal {
    background: #e6a35a; color: #1a1108; padding: 8px 12px;
    font-weight: 700; letter-spacing: 0.28em;
  }
</style></head>
<body>
<div class="photo"></div>
<div class="masthead">
  <span class="vol">RUUF.</span>
  <span class="issue">№ 047 · MANATEE · APRIL '26</span>
</div>
<div class="head">
  <div class="kicker">A FLORIDA STORY</div>
  <h3>${headlineHtml}<br/><em>${escape(HEADLINE_ACCENT)}</em></h3>
</div>
<div class="pull"><em>"The tile outlives everyone. The layer beneath it does not."</em></div>
<div class="body">
  <p class="lead">${escape(LEAD_LINE)}</p>
  <p>${bodyHtml}</p>
</div>
<div class="footer">
  <div>
    <div class="biz">${escape(data.contractorBusinessName)}</div>
    <div class="meta">FL LIC ${escape(data.contractorLicenseNumber)} · ${escape(data.contractorPhone)}</div>
  </div>
  <div class="seal">SCAN BACK ▶</div>
</div>
</body></html>`;
}

// ===========================================================================
// VARIANT F · BLUEPRINT / ENGINEERING DOCUMENT (front only — back TBD)
// ===========================================================================

function renderBlueprintFront(data: PostcardData): string {
  const headlineHtml = HEADLINE_LINES.map(escape).join("<br/>");
  const bodyHtml = renderBodyWithPullouts(BODY_LINE);
  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body { background: #0c2c4a; color: #e6f1ff; font-family: ${STACK.mono}; position: relative; }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(230,241,255,0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(230,241,255,0.08) 1px, transparent 1px);
    background-size: 32px 32px;
  }
  .frame { position: absolute; inset: 28px; border: 1.5px solid rgba(230,241,255,0.55); }
  .frame::before { content: ""; position: absolute; inset: 6px; border: 1px solid rgba(230,241,255,0.25); }
  .top-bar {
    position: absolute; top: 44px; left: 60px; right: 60px;
    display: flex; justify-content: space-between;
    font-family: ${STACK.mono}; font-size: 11px; letter-spacing: 0.22em;
    opacity: 0.75; text-transform: uppercase;
  }
  .head { position: absolute; top: 88px; left: 60px; right: 60px; }
  .head h3 {
    font-family: ${STACK.display}; font-weight: 700;
    font-size: ${MAX_OTHER_FONT_PX}px; line-height: 1; margin: 0;
    letter-spacing: 0.02em; text-transform: uppercase;
  }
  .head .h2 {
    color: #ff8e5a; font-style: italic;
    font-family: ${STACK.serif}; font-weight: 700;
    font-size: 26px; margin-top: 10px; letter-spacing: -0.005em;
  }
  .body {
    position: absolute; left: 60px; right: 540px; bottom: 130px;
    font-family: ${STACK.mono}; font-size: 13px; line-height: 1.5;
    opacity: 0.92;
  }
  .body .lead { font-weight: 700; margin: 0 0 6px; }
  .body p { margin: 0 0 4px; }
  .body .numeral { color: #ff8e5a; font-weight: 700; font-size: 17px; vertical-align: -2px; padding: 0 2px; }
  svg.section { position: absolute; right: 60px; top: 220px; width: 460px; height: 240px; }
  .titleblock {
    position: absolute; bottom: 38px; left: 60px; right: 60px;
    border-top: 1px solid rgba(230,241,255,0.4); padding-top: 12px;
    display: flex; justify-content: space-between;
    font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .titleblock .stack { line-height: 1.6; }
  .titleblock .name {
    font-family: ${STACK.display}; font-weight: 700;
    font-size: 17px; letter-spacing: 0.06em; margin-bottom: 4px;
  }
  .stamp {
    position: absolute; bottom: 96px; right: 60px;
    border: 2px solid #ff8e5a; color: #ff8e5a;
    padding: 7px 13px; font-family: ${STACK.mono}; font-size: 11px;
    letter-spacing: 0.24em; font-weight: 700; text-transform: uppercase;
    transform: rotate(-3deg);
  }
</style></head>
<body>
<div class="grid"></div>
<div class="frame"></div>
<div class="top-bar">
  <span>DWG-2026-A · MANATEE FL</span>
  <span>SCALE 1:1 · ROOF SECTION</span>
</div>
<div class="head">
  <h3>${headlineHtml}</h3>
  <div class="h2">${escape(HEADLINE_ACCENT)}</div>
</div>
<div class="body">
  <p class="lead">${escape(LEAD_LINE)}</p>
  <p>${bodyHtml}</p>
</div>
<svg class="section" viewBox="0 0 460 240" fill="none" stroke="#ff8e5a">
  <text x="30" y="32" font-family="Courier New" font-size="9" fill="#e6f1ff" opacity="0.55" letter-spacing="2">REF · A-201 · ROOF</text>
  <line x1="30" y1="38" x2="170" y2="38" stroke-width="0.5" stroke-opacity="0.3"/>
  <text x="30" y="50" font-family="Courier New" font-size="7.5" fill="#e6f1ff" opacity="0.5" letter-spacing="1.5">FLORIDA HIP · BARREL TILE</text>
  <g transform="translate(425, 52)">
    <circle cx="0" cy="0" r="12" stroke-width="0.6" stroke-opacity="0.55"/>
    <polygon points="0,-9 -3,3 0,1 3,3" fill="#ff8e5a" stroke="none"/>
    <text x="0" y="-13" font-family="Courier New" font-size="7.5" fill="#ff8e5a" text-anchor="middle">N</text>
  </g>
  <polygon points="100,200 320,200 360,160 140,160" stroke-width="0.7" stroke-opacity="0.4" stroke-dasharray="3 3"/>
  <polygon points="100,200 320,200 350,140 130,140" stroke-width="1.7"/>
  <polygon points="320,200 360,160 350,140" stroke-width="1.7"/>
  <line x1="100" y1="200" x2="130" y2="140" stroke-width="1.4"/>
  <line x1="320" y1="200" x2="350" y2="140" stroke-width="1.4"/>
  <line x1="360" y1="160" x2="350" y2="140" stroke-width="1.4"/>
  <line x1="130" y1="140" x2="350" y2="140" stroke-width="2.4"/>
  <circle cx="130" cy="140" r="2.8" fill="#ff8e5a"/>
  <circle cx="350" cy="140" r="2.8" fill="#ff8e5a"/>
  <polygon points="170,225 250,225 250,200 170,200" stroke-width="0.7" stroke-opacity="0.4" stroke-dasharray="3 3"/>
  <polygon points="170,225 250,225 210,170" stroke-width="1.7"/>
  <polygon points="170,225 210,170 220,175 200,200" stroke-width="1.5"/>
  <polygon points="250,225 210,170 220,175 240,200" stroke-width="1.5"/>
  <line x1="210" y1="170" x2="220" y2="175" stroke-width="1.9"/>
  <circle cx="210" cy="170" r="2.6" fill="#ff8e5a"/>
  <line x1="220" y1="175" x2="200" y2="200" stroke-width="1" stroke-opacity="0.85"/>
  <line x1="220" y1="175" x2="240" y2="200" stroke-width="1" stroke-opacity="0.85"/>
  <polygon points="270,180 295,180 282.5,160" stroke-width="1.3"/>
  <line x1="282.5" y1="160" x2="288" y2="165" stroke-width="1.2"/>
  <line x1="270" y1="180" x2="288" y2="165" stroke-width="0.9" stroke-opacity="0.7"/>
  <line x1="295" y1="180" x2="288" y2="165" stroke-width="0.9" stroke-opacity="0.7"/>
  <circle cx="282.5" cy="160" r="1.6" fill="#ff8e5a"/>
  <rect x="276" y="167" width="13" height="9" stroke-width="0.6" stroke-opacity="0.55"/>
  <ellipse cx="210" cy="195" rx="7" ry="3.5" stroke-width="0.7" stroke-opacity="0.65"/>
  <line x1="210" y1="192" x2="210" y2="198" stroke-width="0.5" stroke-opacity="0.5"/>
  <rect x="328" y="146" width="9" height="18" stroke-width="1.3"/>
  <rect x="328" y="146" width="9" height="3" fill="#ff8e5a" stroke="none"/>
  <line x1="100" y1="200" x2="113" y2="180" stroke-width="0.4" stroke-opacity="0.55"/>
  <text x="78" y="185" font-family="Courier New" font-size="9" fill="#ff8e5a">4/12</text>
  <text x="71" y="195" font-family="Courier New" font-size="7" fill="#ff8e5a" opacity="0.7">PITCH</text>
  <line x1="100" y1="232" x2="100" y2="238" stroke-width="0.5" stroke-opacity="0.4"/>
  <line x1="320" y1="232" x2="320" y2="238" stroke-width="0.5" stroke-opacity="0.4"/>
  <line x1="100" y1="235" x2="320" y2="235" stroke-width="0.5" stroke-opacity="0.4"/>
  <text x="210" y="232" font-family="Courier New" font-size="8" fill="#e6f1ff" opacity="0.5" text-anchor="middle">68'-0"</text>
  <line x1="240" y1="138" x2="245" y2="120" stroke-width="0.4" stroke-opacity="0.5"/>
  <text x="248" y="118" font-family="Courier New" font-size="7.5" fill="#ff8e5a" opacity="0.85">RIDGE · CLAY CAP</text>
  <line x1="218" y1="178" x2="155" y2="105" stroke-width="0.4" stroke-opacity="0.5"/>
  <text x="155" y="100" font-family="Courier New" font-size="7.5" fill="#ff8e5a" opacity="0.85">VALLEY · METAL</text>
</svg>
<div class="stamp">SCAN BACK ▶</div>
<div class="titleblock">
  <div class="stack">
    <div class="name">${escape(data.contractorBusinessName)}</div>
    <div>FL LIC ${escape(data.contractorLicenseNumber)} · ${escape(data.contractorPhone)}</div>
  </div>
  <div class="stack" style="text-align: right;">
    <div>FIG. 1 · FLORIDA HIP ROOF · TYPICAL</div>
    <div>${escape(data.propertyAddress.toUpperCase())}</div>
  </div>
</div>
</body></html>`;
}

// ===========================================================================
// VARIANT G · TRADE CARD / WOODBLOCK HERITAGE (front only — back TBD)
// ===========================================================================

function renderTradeFront(data: PostcardData): string {
  const headlineHtml = HEADLINE_LINES.map(escape).join("<br/>");
  const bodyHtml = renderBodyWithPullouts(BODY_LINE);
  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body { background: #f3ebd9; color: #1a1a1a; font-family: ${STACK.serif}; position: relative; }
  .frame { position: absolute; inset: 22px; border: 4px double #b32f1c; }
  .ornament { position: absolute; width: 36px; height: 36px; }
  .ornament.tl { top: 16px; left: 16px; border-top: 4px solid #1a1a1a; border-left: 4px solid #1a1a1a; }
  .ornament.tr { top: 16px; right: 16px; border-top: 4px solid #1a1a1a; border-right: 4px solid #1a1a1a; }
  .ornament.bl { bottom: 16px; left: 16px; border-bottom: 4px solid #1a1a1a; border-left: 4px solid #1a1a1a; }
  .ornament.br { bottom: 16px; right: 16px; border-bottom: 4px solid #1a1a1a; border-right: 4px solid #1a1a1a; }
  .top-bar {
    position: absolute; top: 56px; left: 60px; right: 60px;
    text-align: center; font-family: ${STACK.mono};
    font-size: 12px; letter-spacing: 0.34em; color: #b32f1c;
    font-weight: 700; text-transform: uppercase;
  }
  .top-bar::before, .top-bar::after { content: "*"; padding: 0 14px; }
  .head { position: absolute; left: 60px; right: 460px; top: 100px; }
  .head h3 {
    font-family: ${STACK.display}; font-weight: 700;
    font-size: ${MAX_OTHER_FONT_PX}px; line-height: 1; margin: 0;
    text-transform: uppercase; letter-spacing: 0.005em;
  }
  .head .h2 {
    font-family: ${STACK.serif}; font-style: italic; font-weight: 700;
    font-size: 26px; color: #b32f1c; margin: 10px 0 0;
  }
  .body {
    position: absolute; left: 60px; right: 460px; top: 240px;
    font-family: ${STACK.serif}; font-size: 14px; line-height: 1.55;
  }
  .body .lead { font-style: italic; font-weight: 700; margin: 0 0 6px; }
  .body p { margin: 0 0 4px; }
  .body .numeral {
    font-family: ${STACK.serif}; font-style: italic; font-weight: 700;
    font-size: 18px; color: #b32f1c; vertical-align: -1px; padding: 0 2px;
  }
  .vignette { position: absolute; right: 60px; top: 100px; width: 360px; height: 280px; }
  .footer {
    position: absolute; left: 60px; right: 60px; bottom: 50px;
    display: flex; justify-content: space-between; align-items: flex-end;
  }
  .footer .roofer { font-family: ${STACK.serif}; font-weight: 700; font-size: 22px; line-height: 1; }
  .footer .roofer-meta {
    font-family: ${STACK.mono}; font-size: 10px;
    letter-spacing: 0.16em; opacity: 0.75; margin-top: 6px; text-transform: uppercase;
  }
  .footer .est {
    font-family: ${STACK.mono}; font-size: 11px; letter-spacing: 0.34em;
    color: #b32f1c; text-align: right; font-weight: 700; text-transform: uppercase;
  }
  .footer .est .big {
    font-family: ${STACK.serif}; font-style: italic; font-weight: 700;
    color: #1a1a1a; font-size: 22px; letter-spacing: 0;
    display: block; margin-top: 4px; text-transform: none;
  }
</style></head>
<body>
<div class="frame"></div>
<div class="ornament tl"></div><div class="ornament tr"></div>
<div class="ornament bl"></div><div class="ornament br"></div>
<div class="top-bar">FLORIDA HOMEOWNER NOTICE</div>
<div class="head">
  <h3>${headlineHtml}</h3>
  <div class="h2">${escape(HEADLINE_ACCENT)}</div>
</div>
<div class="body">
  <p class="lead">${escape(LEAD_LINE)}</p>
  <p>${bodyHtml}</p>
</div>
<svg class="vignette" viewBox="0 0 360 280" fill="none">
  <rect x="80" y="160" width="200" height="100" fill="#1a1a1a"/>
  <polygon points="60,160 180,60 300,160" fill="#b32f1c"/>
  <polygon points="60,160 180,60 300,160 280,160 180,80 80,160" fill="#1a1a1a"/>
  <line x1="100" y1="120" x2="260" y2="120" stroke="#1a1a1a" stroke-width="1.5"/>
  <line x1="120" y1="100" x2="240" y2="100" stroke="#1a1a1a" stroke-width="1.5"/>
  <line x1="140" y1="80" x2="220" y2="80" stroke="#1a1a1a" stroke-width="1.5"/>
  <rect x="160" y="200" width="40" height="60" fill="#f3ebd9"/>
  <rect x="100" y="190" width="40" height="40" fill="#f3ebd9"/>
  <rect x="220" y="190" width="40" height="40" fill="#f3ebd9"/>
  <line x1="120" y1="190" x2="120" y2="230" stroke="#1a1a1a" stroke-width="1.5"/>
  <line x1="100" y1="210" x2="140" y2="210" stroke="#1a1a1a" stroke-width="1.5"/>
  <line x1="240" y1="190" x2="240" y2="230" stroke="#1a1a1a" stroke-width="1.5"/>
  <line x1="220" y1="210" x2="260" y2="210" stroke="#1a1a1a" stroke-width="1.5"/>
  <line x1="0" y1="260" x2="360" y2="260" stroke="#1a1a1a" stroke-width="3"/>
  <text x="180" y="40" font-family="Georgia" font-style="italic" font-size="20" fill="#b32f1c" text-anchor="middle">- ESTABLISHED -</text>
</svg>
<div class="footer">
  <div>
    <div class="roofer">${escape(data.contractorBusinessName)}</div>
    <div class="roofer-meta">FL LIC ${escape(data.contractorLicenseNumber)} · ${escape(data.contractorPhone)}</div>
  </div>
  <div class="est">
    FREE INSPECTION
    <span class="big">No Call. No Pitch.</span>
  </div>
</div>
</body></html>`;
}

// ===========================================================================
// PLACEHOLDER BACK · for variants without a designed back yet (C-G)
// ===========================================================================

function renderPlaceholderBack(data: PostcardData, label: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  ${BASE_STYLES}
  body {
    background: #f5f3ee; color: #555;
    font-family: ${STACK.mono};
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 40px;
  }
  .pill {
    font-family: ${STACK.mono}; font-size: 11px; letter-spacing: 0.32em;
    text-transform: uppercase; padding: 6px 12px; border: 1px solid #aaa;
    color: #888; margin-bottom: 24px;
  }
  h2 {
    font-family: ${STACK.display}; font-weight: 700; font-size: 28px;
    letter-spacing: 0.005em; text-transform: uppercase; color: #444;
    margin: 0 0 14px;
  }
  p { font-family: ${STACK.serif}; font-style: italic; font-size: 16px; max-width: 560px; line-height: 1.5; margin: 0 0 8px; color: #666; }
  .meta { font-family: ${STACK.mono}; font-size: 10px; letter-spacing: 0.22em; color: #999; text-transform: uppercase; margin-top: 22px; }
</style></head>
<body>
  <div class="pill">▸ BACK DESIGN PENDING</div>
  <h2>${escape(label)}</h2>
  <p>The back of this variant is not yet designed. The front is fully wired and previewable; the matching back will be built in a follow-up session.</p>
  <p>Until then, this variant cannot be selected for live sends — only Press Bulletin (A) and Tool Catalog (B) have complete front + back compositions.</p>
  <div class="meta">${escape(data.contractorBusinessName)} · FL LIC ${escape(data.contractorLicenseNumber)}</div>
</body></html>`;
}

// ===========================================================================
// PUBLIC API
// ===========================================================================

/** Variants with a fully designed front + back. Only these can be sent live. */
export const SHIPPABLE_VARIANTS: readonly FrontVariant[] = ["A", "B"] as const;

export function renderPostcardFront(
  data: PostcardData,
  opts: RenderOptions = {}
): string {
  const variant: FrontVariant = opts.variant ?? "A";
  switch (variant) {
    case "B": return renderToolFront(data);
    case "C": return renderMaterialFront(data);
    case "D": return renderForensicFront(data);
    case "E": return renderEditorialFront(data);
    case "F": return renderBlueprintFront(data);
    case "G": return renderTradeFront(data);
    case "A":
    default:  return renderPressFront(data);
  }
}

export function renderPostcardBack(
  data: PostcardData,
  opts: RenderOptions = {}
): string {
  const variant: FrontVariant = opts.variant ?? "A";
  switch (variant) {
    case "B": return renderToolBack(data);
    case "C": return renderPlaceholderBack(data, "Material Catalog · Vol. 47");
    case "D": return renderPlaceholderBack(data, "Forensic Specimen · Case File 8734");
    case "E": return renderPlaceholderBack(data, "Italian Editorial · Roof, on Cover");
    case "F": return renderPlaceholderBack(data, "Blueprint · Engineering Document");
    case "G": return renderPlaceholderBack(data, "Trade Card · Woodblock Heritage");
    case "A":
    default:  return renderPressBack(data);
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
