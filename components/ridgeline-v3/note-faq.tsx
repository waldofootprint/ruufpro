import { Section, Wrap, Eyebrow, Display } from "./_primitives";
import styles from "./note-faq.module.css";

const FAQ = [
  {
    q: "Do you provide phone numbers?",
    a: "No. You use your existing phone. We give you a smart link to drop into your phone's auto-reply — the AI does the qualifying when you miss a call.",
  },
  {
    q: "Is this an AI voice receptionist?",
    a: "No. We don't answer calls on your behalf. Your phone auto-texts the homeowner; the AI handles them via chat once they tap the link.",
  },
  {
    q: "How fast can I get this live?",
    a: "5 minutes for the calculator embed and AI assistant link. Reviews and missed-call setup take another 5 minutes each. You can be fully live the day you sign up.",
  },
  {
    q: "What happens after the 30-day trial?",
    a: "$149/month, no auto-charge surprises — we email before billing kicks in. Cancel any time, no contract.",
  },
];

export function NoteFAQ() {
  return (
    <Section variant="dark">
      <Wrap>
        <Eyebrow>From the developer</Eyebrow>
        <Display>
          Why I built this for <em>solo crews.</em>
        </Display>

        <div className={styles.grid}>
          <div>
            <div className={styles.noteBody}>
              <p>
                I&apos;m a developer in Bradenton. I kept watching small
                roofing crews — the kind doing real work — get lapped by big
                franchises with no crews at all but slick websites and
                instant-quote tools.
              </p>
              <p>
                <strong>RuufPro gives you the same tools the franchises have.</strong>{" "}
                One flat price, no per-lead games, no salespeople. Built by
                hand, by one developer. If it doesn&apos;t make sense for you
                in 30 days, you walk. That&apos;s the deal.
              </p>
            </div>

            <div className={styles.signatureRow}>
              <div className={styles.avatar} aria-hidden="true">
                H
              </div>
              <div className={styles.signature}>
                <span className={styles.signatureName}>— Hannah</span>
                <span className={styles.signatureMeta}>
                  Founder · Bradenton, FL · hannah@ruufpro.com
                </span>
              </div>
            </div>

            <div className={styles.noteCtas}>
              <a className="rv3-btn-primary" href="/signup">
                Start 30 days free →
              </a>
              <a className="rv3-btn-secondary" href="mailto:hannah@ruufpro.com">
                Email me directly
              </a>
            </div>
          </div>

          <div>
            <div className={styles.faqHeader}>FAQ</div>
            <div className={styles.faqList}>
              {FAQ.map((item, i) => (
                <details key={item.q} className={styles.faqItem} open={i === 0}>
                  <summary className={styles.faqSummary}>{item.q}</summary>
                  <div className={styles.faqAnswer}>{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
