import { Section, Wrap, Eyebrow, Display, Lede } from "./_primitives";
import styles from "./pricing.module.css";

export function Pricing() {
  return (
    <Section id="pricing" variant="sand">
      <Wrap>
        <Eyebrow>Pricing · One plan · No tiers</Eyebrow>
        <Display>
          One number. <em>Everything included.</em>
        </Display>
        <Lede>
          No setup fees. No per-lead charges. No contracts. Free for the first
          30 days — no credit card needed.
        </Lede>

        {/* Scarcity card — promoted from buried right-column footnote */}
        <div className={styles.scarcity}>
          <span className={styles.scarcityLabel}>Limited · Founding cohort</span>
          <span className={styles.scarcityCount}>
            <strong>First 5 roofers</strong> · 30 days free · no card
          </span>
          <span className={styles.scarcityBody}>
            No contract. <strong>No salesperson will ever call you.</strong>
          </span>
        </div>

        <div className={styles.cardOuter}>
          <div className={styles.card}>
            <div className={styles.ribbon}>The only plan</div>

            <div className={styles.left}>
              <div className={styles.lab}>RuufPro · Pro</div>

              <div className={styles.priceRow}>
                <div className={styles.pr}>$149</div>
                <div className={styles.roi}>
                  Close one extra replacement a year and you&apos;re up
                  $6,000+.
                  <small>Per-job ROI</small>
                </div>
              </div>

              <div className={styles.per}>per month · billed monthly</div>

              <p className={styles.pitch}>
                Everything you need to capture, qualify, and close more roofing
                jobs. <strong>One flat price. No per-lead games.</strong>
              </p>

              <div className={styles.ctaRow}>
                <a className="rv3-btn-primary" href="/signup">
                  Start 30-day free trial →
                </a>
              </div>

              <div className={styles.terms}>
                <span>No card</span>
                <span>Cancel any time</span>
                <span>Month-to-month</span>
              </div>
            </div>

            <div className={styles.right}>
              <ul>
                <li>
                  Instant Calculator — embeds on any site, in ads, on door
                  hangers
                </li>
                <li>
                  AI assistant — 24/7, English + Spanish, trained on your
                  business
                </li>
                <li>
                  Missed-call recovery — smart link for your phone&apos;s
                  auto-reply
                </li>
                <li>Lead dashboard with smart intel</li>
                <li>Review push notifications + automated email reviews</li>
                <li>Your colors, your logo, your voice</li>
                <li>Unlimited leads — no per-lead fees, ever</li>
              </ul>
              <div className={styles.footnote}>
                <strong>Built by hand</strong> by one developer in Bradenton,
                FL. If it doesn&apos;t make sense for you in 30 days, you walk.
                That&apos;s the deal.
              </div>
            </div>
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
