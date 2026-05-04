"use client";

import dynamic from "next/dynamic";
import ChatWidget from "@/components/chat-widget/ChatWidget";
import EstimateWidgetV4 from "@/components/estimate-widget-v4";
import { STUB_HIP_ROOF } from "@/lib/roof-3d-stub-data";

const RoofRender3D = dynamic(
  () => import("@/components/widget/roof-render-3d").then((m) => m.RoofRender3D),
  { ssr: false, loading: () => <div className="render-3d-skeleton" /> }
);


interface ProspectData {
  id: string;
  businessName: string;
  city: string;
  state: string;
  phone: string;
  rating: number;
  reviewsCount: number;
  services: string[];
  serviceAreas: string[];
  faq: Array<{ question: string; answer: string }> | null;
  about: string | null;
  ownerName: string | null;
  contractorId: string | null;
}

export default function DemoPageClient({ prospect }: { prospect: ProspectData }) {
  const contractorId = prospect.contractorId || prospect.id;

  return (
    <div className="demo-v5-root">
      <style>{CSS}</style>

      <div className="stage">
        {/* ════════ HERO ZONE ════════ */}
        <section className="hero-zone">
          <div className="glow" aria-hidden />
          <span className="top-bar-pill">Built for {prospect.businessName}</span>
          <h1 className="hero-h1">
            This AI knows your <em>business.</em>
          </h1>
          <p className="hero-lede">
            Ask Riley anything about your roofing company. He already knows.
          </p>

          <div className="hero-riley-live">
            <div className="riley-header">
              <div className="riley-avatar">R</div>
              <div className="riley-meta">
                <div className="riley-name">Riley</div>
                <div className="riley-status"><span className="riley-dot" />online</div>
              </div>
              <span className="riley-live-pill">Live</span>
            </div>
            <div className="riley-frame">
              <ChatWidget
                contractorId={contractorId}
                businessName={prospect.businessName}
                hasAiChatbot={true}
                accentColor="#F97316"
                fontFamily="DM Sans"
                isStandalone={true}
              />
            </div>
          </div>
        </section>

        {/* ════════ SCROLL HINT ════════ */}
        <div className="scroll-hint">See what else we built you ↓</div>

        {/* ════════ ESTIMATE WIDGET SECTION ════════ */}
        <section>
          <div className="section-eyebrow">Tool 2 of 5</div>
          <h2 className="section-h2">
            Instant roof estimates — <em>without the tape measure.</em>
          </h2>
          <p className="section-lede">
            Homeowners type their address. Satellite math does the rest. Qualified leads
            before you pick up the phone.
          </p>

          <div className="card-quiet">
            <div className="kicker">Estimate Widget</div>
            <h3>Works on your site. Or a QR card. Or a text.</h3>
            <p>
              Drop it anywhere. It pulls roof size, pitch, and material from satellite
              imagery — then returns your ballpark at your rates.
            </p>
            <div className="widget-embed">
              <EstimateWidgetV4
                contractorId={contractorId}
                contractorName={prospect.businessName}
                contractorPhone={prospect.phone || ""}
                variant="light"
                accentColor="#F97316"
              />
            </div>
          </div>
        </section>

        {/* ════════ 3D ROOF RENDER SECTION ════════ */}
        <section>
          <div className="section-eyebrow">Tool 3 of 5</div>
          <h2 className="section-h2">
            See <em>their roof in 3D</em> — measured from space.
          </h2>
          <p className="section-lede">
            The estimate isn&apos;t just a number — homeowners see the actual roof we measured.
            Ridges, hips, valleys, every plane. Trust before you&apos;ve picked up the phone.
          </p>

          <div className="card-quiet">
            <div className="kicker">3D Roof Model</div>
            <h3>Proof we measured the right roof.</h3>
            <p>
              LiDAR + satellite imagery generates a real 3D model of every roof we estimate.
              Homeowners drag, zoom, and see the planes our pricing is built from.
            </p>
            <div className="render-3d-embed">
              <RoofRender3D scene={STUB_HIP_ROOF} />
            </div>
          </div>
        </section>

        {/* ════════ REVIEW MAGNET SECTION ════════ */}
        <section>
          <div className="section-eyebrow">Tool 4 of 5</div>
          <h2 className="section-h2">
            Turn finished jobs into <em>5-star reviews</em> — automatically.
          </h2>
          <p className="section-lede">
            Tap-to-review NFC cards. Email follow-ups. Slack pings when a new review lands.
            No chasing.
          </p>

          <div className="card-quiet">
            <div className="kicker">Review Magnet</div>
            <h3>NFC card + auto email sequence</h3>
            <p>
              Hand a card at job completion. Homeowner taps their phone → lands on your
              Google review page. Backup email fires 24hrs later if they don&apos;t.
            </p>
          </div>
        </section>

        {/* ════════ COPILOT SECTION ════════ */}
        <section>
          <div className="section-eyebrow">Tool 5 of 5</div>
          <h2 className="section-h2">
            An AI that reads every lead <em>before you do.</em>
          </h2>
          <p className="section-lede">
            Copilot tells you who&apos;s hot, what they viewed, and what to say. No more
            guessing which lead to chase.
          </p>

          <div className="card-quiet">
            <div className="kicker">Roofer Copilot</div>
            <h3>Who should you text first?</h3>
            <p>
              Copilot ranks every lead by intent signal — address provided, checked their
              estimate 3x, asked about timing. You focus on the ones ready to buy.
            </p>
          </div>
        </section>

        {/* ════════ SCROLL HINT MID ════════ */}
        <div className="scroll-hint">Where to put it ↓</div>

        {/* ════════ WHERE TO USE GRID (placeholder — flagged for revision) ════════ */}
        <section>
          <h2 className="section-h2" style={{ fontSize: 26 }}>
            Put it anywhere you already are.
          </h2>
          <p className="section-lede">
            Every tool works standalone or embedded — wherever homeowners already find you.
          </p>

          <div className="use-grid">
            {[
              { icon: "📱", title: "QR code", sub: "On yard signs, trucks, invoices." },
              { icon: "✉️", title: "Email signature", sub: "\"Chat with Riley →\" link." },
              { icon: "🌐", title: "Your website", sub: "One-line embed script." },
              { icon: "🗺️", title: "Google Business", sub: "Drop the link in your profile." },
              { icon: "💬", title: "Text to a lead", sub: "\"Here's a ballpark link.\"" },
              { icon: "🚚", title: "Truck wrap", sub: "QR right on the side." },
            ].map((u) => (
              <div key={u.title} className="use-item">
                <div className="icon">{u.icon}</div>
                <strong>{u.title}</strong>
                <span>{u.sub}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ════════ TRUST BAND ════════ */}
        <section className="trust-band">
          <div className="stat">24/7</div>
          <div className="stat-label">
            Riley never sleeps. Never forgets. Never drops a lead.
          </div>
          <p className="quote">
            &ldquo;Our lead response time dropped from 4 hours to instant. Closed 2 deals
            last week that Riley qualified overnight.&rdquo;
          </p>
          <div className="attrib">— Mike · Blue Vision Roofing</div>
        </section>

        {/* ════════ FINAL CTA BOOKEND ════════ */}
        <section className="cta-zone">
          <div className="glow-band" aria-hidden />
          <div className="cta-content">
            <h2 className="cta-h">Claim your tools, {prospect.businessName}.</h2>
            <p className="cta-sub-line">
              We built them for your business. They&apos;re yours for 14 days — no card, no
              catch.
            </p>
            <a href="#" className="cta-glass">
              Claim Your Tools →
            </a>
            <p className="cta-urgency">Claim them before they expire.</p>
            <p className="risk-reversal">Free for 14 days · No credit card required</p>
          </div>
        </section>

        <footer className="demo-footer">
          Built for {prospect.businessName} · Powered by{" "}
          <a href="https://ruufpro.com">RuufPro</a>
        </footer>
      </div>
    </div>
  );
}

const CSS = `
.demo-v5-root {
  font-family: "DM Sans", -apple-system, system-ui, sans-serif;
  color: #0F0F0F;
  -webkit-font-smoothing: antialiased;
  background: #1a1a1a;
  min-height: 100vh;
}
.demo-v5-root * { box-sizing: border-box; }

.demo-v5-root .stage {
  max-width: 390px;
  margin: 0 auto;
  background: #FAF8F4;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}
@media (min-width: 420px) {
  .demo-v5-root .stage {
    margin-top: 20px;
    margin-bottom: 20px;
    border-radius: 32px;
    box-shadow: 0 40px 120px -20px rgba(0,0,0,0.6);
  }
}

.demo-v5-root section { position: relative; padding: 28px 20px; }
.demo-v5-root section + section { padding-top: 8px; }

/* ── HERO ── */
.demo-v5-root .hero-zone { padding: 36px 20px 40px; position: relative; overflow: hidden; }
.demo-v5-root .hero-zone .glow {
  position: absolute; pointer-events: none;
  width: 420px; height: 420px; top: 180px; left: -100px;
  background: radial-gradient(circle, rgba(249,115,22,0.5), rgba(249,115,22,0) 70%);
  filter: blur(36px); z-index: 0;
}
.demo-v5-root .top-bar-pill {
  display: inline-block;
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.9);
  padding: 9px 14px; border-radius: 999px;
  font-size: 10px; letter-spacing: 0.14em; font-weight: 700;
  color: #F97316; text-transform: uppercase;
  box-shadow: 0 6px 14px -4px rgba(0,0,0,0.08);
  position: relative; z-index: 2;
}
.demo-v5-root .hero-h1 {
  font-size: 42px; line-height: 1.0; letter-spacing: -0.04em; font-weight: 700;
  margin: 20px 0 12px; position: relative; z-index: 2;
}
.demo-v5-root .hero-h1 em { font-style: normal; color: #F97316; }
.demo-v5-root .hero-lede {
  font-size: 16px; line-height: 1.5; color: #444; margin: 0 0 26px;
  position: relative; z-index: 2;
}
.demo-v5-root .hero-riley {
  background: #FAF8F4;
  border-radius: 22px;
  padding: 22px;
  box-shadow:
    10px 10px 24px rgba(184, 175, 158, 0.6),
    -8px -8px 18px rgba(255, 255, 255, 0.95);
  position: relative; z-index: 2;
}
.demo-v5-root .hero-riley-live {
  background: #FAF8F4;
  border-radius: 22px;
  padding: 14px;
  box-shadow:
    10px 10px 24px rgba(184, 175, 158, 0.6),
    -8px -8px 18px rgba(255, 255, 255, 0.95);
  position: relative; z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.demo-v5-root .riley-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 6px 0;
}
.demo-v5-root .riley-header .riley-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: #1F1A17;
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 15px;
  flex-shrink: 0;
}
.demo-v5-root .riley-header .riley-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  flex: 1;
}
.demo-v5-root .riley-header .riley-name {
  font-weight: 600;
  font-size: 15px;
  color: #1F1A17;
}
.demo-v5-root .riley-header .riley-status {
  font-size: 12px;
  color: #5C544A;
  display: flex; align-items: center; gap: 6px;
}
.demo-v5-root .riley-header .riley-dot {
  width: 7px; height: 7px;
  background: #16A34A;
  border-radius: 50%;
  display: inline-block;
}
.demo-v5-root .riley-header .riley-live-pill {
  background: rgba(249,115,22,0.12);
  color: #D26310;
  border: 1px solid rgba(249,115,22,0.3);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.demo-v5-root .hero-riley-live .riley-frame {
  height: 520px;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  position: relative;
}
.demo-v5-root .chip {
  position: absolute; top: 14px; right: 14px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.9);
  padding: 4px 10px; border-radius: 999px;
  font-size: 10px; letter-spacing: 0.08em; font-weight: 700;
  color: #F97316; text-transform: uppercase;
  box-shadow: 0 4px 10px -2px rgba(0,0,0,0.06);
}
.demo-v5-root .chip.live::before {
  content: ""; display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: #16a34a; margin-right: 6px; vertical-align: 2px;
  box-shadow: 0 0 0 3px rgba(22,163,74,0.18);
}
.demo-v5-root .avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, #F97316, #FB923C);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 18px;
  margin-bottom: 12px;
  box-shadow: 0 8px 18px -4px rgba(249,115,22,0.6);
}
.demo-v5-root .r-label {
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: #888; font-weight: 600; margin-bottom: 10px;
}
.demo-v5-root .bubble-in,
.demo-v5-root .bubble-out {
  padding: 10px 14px; border-radius: 14px;
  font-size: 14px; line-height: 1.45; max-width: 85%;
  margin-bottom: 6px;
}
.demo-v5-root .bubble-in { background: #F5F3EE; color: #111; border-top-left-radius: 4px; }
.demo-v5-root .bubble-out { background: #1F1A17; color: #fff; margin-left: auto; border-top-right-radius: 4px; }
.demo-v5-root .riley-input {
  margin-top: 12px;
  display: flex; align-items: center;
  background: #fff; border-radius: 999px;
  padding: 10px 14px;
  box-shadow: inset 2px 2px 6px rgba(184,175,158,0.3);
  font-size: 13px; color: #999;
}
.demo-v5-root .riley-input .send {
  margin-left: auto;
  width: 28px; height: 28px; border-radius: 50%;
  background: #0F0F0F; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}

/* ── SECTION HEADER ── */
.demo-v5-root .section-eyebrow {
  font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
  color: #888; font-weight: 700; margin: 0 0 10px;
}
.demo-v5-root .section-h2 {
  font-size: 28px; line-height: 1.08; letter-spacing: -0.028em; font-weight: 700;
  margin: 0 0 14px;
}
.demo-v5-root .section-h2 em { font-style: normal; color: #F97316; }
.demo-v5-root .section-lede {
  font-size: 15px; line-height: 1.5; color: #555; margin: 0 0 22px;
}

/* ── SHALLOW NEU CARDS ── */
.demo-v5-root .card-quiet {
  background: #FAF8F4;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow:
    4px 4px 10px rgba(184, 175, 158, 0.35),
    -4px -4px 10px rgba(255, 255, 255, 0.85);
}
.demo-v5-root .card-quiet h3 {
  margin: 0 0 6px; font-size: 18px; letter-spacing: -0.02em; font-weight: 600;
}
.demo-v5-root .card-quiet p {
  margin: 0 0 10px; font-size: 14px; line-height: 1.5; color: #555;
}
.demo-v5-root .card-quiet .kicker {
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: #F97316; font-weight: 700; margin: 0 0 8px;
}
.demo-v5-root .widget-embed {
  background: #fff; border-radius: 14px; padding: 14px; margin-top: 12px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.04);
  overflow: hidden;
}
.demo-v5-root .render-3d-embed {
  border-radius: 14px; margin-top: 12px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.04);
  overflow: hidden;
}
.demo-v5-root .render-3d-skeleton {
  height: 560px; border-radius: 16px; margin-top: 12px;
  background: linear-gradient(135deg, #cfe6f5 0%, #f4ede1 100%);
  animation: pulse-3d 1.6s ease-in-out infinite;
}
@keyframes pulse-3d { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }

/* ── SCROLL HINT ── */
.demo-v5-root .scroll-hint {
  text-align: center;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: #999; font-weight: 700;
  padding: 10px 0 28px;
}

/* ── WHERE TO USE GRID ── */
.demo-v5-root .use-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;
}
.demo-v5-root .use-item {
  background: #fff;
  border-radius: 14px;
  padding: 16px 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04);
}
.demo-v5-root .use-item .icon {
  width: 32px; height: 32px; border-radius: 10px;
  background: linear-gradient(135deg, #FFEDD5, #FED7AA);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; margin-bottom: 10px;
}
.demo-v5-root .use-item strong {
  display: block; font-size: 13px; font-weight: 600; letter-spacing: -0.01em;
}
.demo-v5-root .use-item span {
  display: block; font-size: 12px; color: #777; margin-top: 2px; line-height: 1.35;
}

/* ── TRUST BAND ── */
.demo-v5-root .trust-band {
  padding: 40px 20px 32px;
  text-align: center;
  background: transparent;
}
.demo-v5-root .trust-band .stat {
  font-size: 44px; font-weight: 700; letter-spacing: -0.04em;
  background: linear-gradient(135deg, #F97316, #FB923C);
  -webkit-background-clip: text; background-clip: text;
  color: transparent;
  line-height: 1;
}
.demo-v5-root .trust-band .stat-label {
  margin-top: 8px; font-size: 13px; color: #666; font-weight: 500;
}
.demo-v5-root .trust-band .quote {
  margin-top: 28px;
  font-size: 16px; line-height: 1.45; color: #222;
  letter-spacing: -0.01em; font-weight: 500;
}
.demo-v5-root .trust-band .attrib {
  margin-top: 12px; font-size: 12px; color: #888;
  letter-spacing: 0.04em; text-transform: uppercase; font-weight: 600;
}

/* ── CTA BOOKEND ── */
.demo-v5-root .cta-zone {
  padding: 56px 20px 56px;
  position: relative;
  overflow: hidden;
}
.demo-v5-root .cta-zone .glow-band {
  position: absolute; bottom: 0; left: 0; right: 0; height: 85%;
  background: linear-gradient(180deg, rgba(255,237,213,0) 0%, rgba(253,186,116,0.4) 50%, rgba(249,115,22,0.55) 100%);
  pointer-events: none; z-index: 0;
}
.demo-v5-root .cta-content { position: relative; z-index: 2; }
.demo-v5-root .cta-h {
  font-size: 34px; line-height: 1.05; letter-spacing: -0.035em; font-weight: 700;
  margin: 0 0 10px;
}
.demo-v5-root .cta-sub-line {
  font-size: 15px; line-height: 1.45; color: #5a3a10; margin: 0 0 26px; font-weight: 500;
}
.demo-v5-root .cta-glass {
  display: block; width: 100%;
  background: rgba(31,26,23,0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 18px;
  font-family: inherit; font-size: 16px; font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none; text-align: center;
  box-shadow: 0 14px 36px -8px rgba(249,115,22,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
}
.demo-v5-root .cta-urgency {
  font-size: 13px; color: #5a3a10; text-align: center; margin-top: 12px; font-weight: 500;
}
.demo-v5-root .risk-reversal {
  font-size: 12px; color: #6b4a21; text-align: center; margin-top: 6px;
}

/* ── FOOTER ── */
.demo-v5-root .demo-footer {
  padding: 28px 20px 36px; text-align: center;
  font-size: 11px; color: #999; letter-spacing: 0.04em;
  background: #FAF8F4;
}
.demo-v5-root .demo-footer a { color: #666; text-decoration: none; }
`;
