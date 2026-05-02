import { Section, Wrap, Eyebrow, Display, Lede } from "./_primitives";
import styles from "./google-update.module.css";

const CITATIONS = [
  {
    pub: "Footbridge",
    date: "Dec 2025",
    take: "Online estimates filter rolled out to roofing local pack search.",
    url: "#",
  },
  {
    pub: "Altavista",
    date: "Jan 2026",
    take: "Roofers without instant pricing seeing 30%+ visibility loss.",
    url: "#",
  },
  {
    pub: "Priceguide",
    date: "Jan 2026",
    take: "Homeowners now filter for instant-quote-capable contractors.",
    url: "#",
  },
  {
    pub: "Demand-iq",
    date: "Dec 16 2025",
    take: "Filter is sticky — once toggled, it stays on across sessions.",
    url: "#",
  },
];

export function GoogleUpdate() {
  return (
    <Section id="update" variant="sand">
      <Wrap>
        <Eyebrow>The update · December 2025</Eyebrow>
        <Display>
          Google now <em>hides</em> roofers without instant pricing.
        </Display>
        <Lede>
          In late 2025, Google added an &ldquo;Online Estimates&rdquo; filter
          to roofing search. Roofers without an instant price calculator on
          their site started getting passed over before the homeowner ever saw
          them. Most don&apos;t know yet — which is why the window is still
          open.
        </Lede>

        <div className={styles.grid}>
          {/* LEFT — side-by-side filter ON / filter OFF mocks */}
          <div className={styles.mocks}>
            <div className={`${styles.gmock} ${styles.gmockOff}`} aria-hidden="true">
              <div className={styles.gmockLabel}>Filter OFF · You rank</div>
              <div className={styles.url}>google.com/search?q=roofer</div>
              <div className={styles.search}>🔍 roofer near me</div>
              <div className={styles.filters}>
                <div className={styles.chip}>Open now</div>
                <div className={styles.chip}>Top rated</div>
                <div className={styles.chip}>Online estimates</div>
              </div>
              <div className={styles.results}>
                <div className={styles.result}>
                  <div className={styles.biz}>Stevens &amp; Sons Roofing</div>
                  <div className={styles.meta}>★ 4.9 · 89 reviews</div>
                </div>
                <div className={styles.result}>
                  <div className={styles.biz}>Bradenton Roofing Co.</div>
                  <div className={styles.meta}>★ 4.7 · 211 reviews</div>
                </div>
                <div className={styles.result}>
                  <div className={styles.biz}>Ironshield Roofing</div>
                  <div className={styles.meta}>★ 4.8 · 142 reviews</div>
                </div>
              </div>
            </div>

            <div className={`${styles.gmock} ${styles.gmockOn}`} aria-hidden="true">
              <div className={styles.gmockLabel}>Filter ON · You disappear</div>
              <div className={styles.url}>google.com/search?q=roofer</div>
              <div className={styles.search}>🔍 roofer near me</div>
              <div className={styles.filters}>
                <div className={styles.chip}>Open now</div>
                <div className={styles.chip}>Top rated</div>
                <div className={styles.chipActive}>Online estimates</div>
              </div>
              <div className={styles.results}>
                <div className={styles.result}>
                  <div className={styles.biz}>Ironshield Roofing</div>
                  <div className={styles.meta}>
                    ★ 4.8 · 142 reviews · &ldquo;Get instant estimate&rdquo;
                  </div>
                  <div className={styles.badge}>Online estimates</div>
                </div>
                <div className={`${styles.result} ${styles.resultDim}`}>
                  <div className={styles.biz}>Stevens &amp; Sons Roofing</div>
                  <div className={styles.meta}>★ 4.9 · 89 · Call for quote</div>
                </div>
                <div className={`${styles.result} ${styles.resultDim}`}>
                  <div className={styles.biz}>Bradenton Roofing Co.</div>
                  <div className={styles.meta}>★ 4.7 · 211 · Call for quote</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — 3 numbered points */}
          <div className={styles.points}>
            <div className={styles.point}>
              <div className={styles.ptNum}>01</div>
              <div>
                <div className={styles.ptH}>It&apos;s a real filter.</div>
                <div className={styles.ptB}>
                  Confirmed by 4 independent industry sources between Dec 2025
                  and early 2026.
                </div>
              </div>
            </div>
            <div className={styles.point}>
              <div className={styles.ptNum}>02</div>
              <div>
                <div className={styles.ptH}>Homeowners are using it.</div>
                <div className={styles.ptB}>
                  They want a number now, on their phone, before they pick up
                  the phone.
                </div>
              </div>
            </div>
            <div className={styles.point}>
              <div className={styles.ptNum}>03</div>
              <div>
                <div className={styles.ptH}>The fix takes one line of code.</div>
                <div className={styles.ptB}>
                  Drop RuufPro&apos;s calculator on your site. Google sees it.
                  You stop getting filtered out.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Source citation cards */}
        <div className={styles.citationsGrid}>
          <div className={styles.citationsLabel}>Sources</div>
          <div className={styles.cards}>
            {CITATIONS.map((c) => (
              <a
                key={c.pub}
                className={styles.card}
                href={c.url}
                target="_blank"
                rel="noreferrer"
              >
                <div className={styles.cardPub}>{c.pub}</div>
                <div className={styles.cardDate}>{c.date}</div>
                <div className={styles.cardTake}>{c.take}</div>
              </a>
            ))}
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
