/**
 * Minimal postcard template — step 4 (functional baseline).
 *
 * Step 5 ships the full creative (with-photo + no-photo variants, branded
 * design, Lob first-piece approval). Step 6 wires legal floor (verbatim
 * SB 76 disclosure text from FL §489.147(2)(a) at 12pt+ and ≥½ largest font).
 *
 * Format: 6×11 standard-class. Bleed 11.25×6.25in (1125×625 px @ 100dpi).
 * Both sides return ready-to-send HTML strings for Lob's Postcards API.
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
  optOutUrl: string;
  publicSiteUrl?: string;
}

const PLACEHOLDER_DISCLOSURE =
  // Step 6 will replace with the verbatim §489.147(2)(a) text.
  // Including a clearly-flagged placeholder is intentional — fails closed
  // (visible "PLACEHOLDER" string in any pre-prod render) so we cannot
  // accidentally mail without the wiring complete.
  "[PLACEHOLDER — SB 76 §489.147(2)(a) disclosure verbatim, inserted at step 6 before live mailing.]";

export function renderPostcardFront(data: PostcardData): string {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  @page { size: ${SIZE_BLEED_PX.w}px ${SIZE_BLEED_PX.h}px; margin: 0; }
  html, body { width: ${SIZE_BLEED_PX.w}px; height: ${SIZE_BLEED_PX.h}px; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: #f7f3ec; color: #1a1a1a; }
  .frame { box-sizing: border-box; width: 100%; height: 100%; padding: 80px 100px; display: flex; flex-direction: column; justify-content: space-between; }
  .eyebrow { font-size: 22px; letter-spacing: 0.18em; text-transform: uppercase; color: #b85c2a; font-weight: 700; }
  .headline { font-size: 76px; line-height: 1.05; font-weight: 800; max-width: 850px; }
  .sub { font-size: 28px; line-height: 1.4; max-width: 800px; margin-top: 20px; color: #333; }
  .roofer { font-size: 30px; font-weight: 700; }
  .small { font-size: 18px; color: #555; }
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
  .left h2 { font-size: 36px; margin: 0 0 16px; }
  .left p { font-size: 22px; line-height: 1.4; margin: 0 0 12px; }
  .qr-block { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
  .qr-img { width: 280px; height: 280px; }
  .code { font-size: 32px; font-family: 'Courier New', monospace; letter-spacing: 0.12em; font-weight: 700; }
  .scan-cta { font-size: 22px; font-weight: 700; }
  .footer { grid-column: 1 / -1; border-top: 1px solid #ddd; padding-top: 16px; font-size: 12px; line-height: 1.35; color: #444; }
  .disclosure { font-size: 12px; font-weight: 700; }
  .opt-out { font-size: 12px; margin-top: 6px; }
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
    <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=560x560&amp;data=${encodeURIComponent(data.qrUrl)}" alt="Scan to chat" />
    <div class="scan-cta">Scan or visit</div>
    <div class="code">${escape(data.qrShortCode)}</div>
    <div style="font-size:14px;color:#666;">ruufpro.com/m/${escape(data.qrShortCode)}</div>
  </div>
  <div class="footer">
    <div class="disclosure">${escape(PLACEHOLDER_DISCLOSURE)}</div>
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
