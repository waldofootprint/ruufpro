import { Nav } from "./nav";
import styles from "./hero.module.css";

export function HeroStage() {
  return (
    <div className={styles.stage}>
      <div className={styles.gridBg} />
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />

      <Nav />

      <section className={styles.hero}>
        <div className={styles.heroWrap}>
          <div>
            <div className={styles.pill}>
              <span className="v">v1.0</span>
              Built in Bradenton · 2026
              <span className="arrow">→</span>
            </div>
            <h1 className={styles.h1}>
              The lead engine for crews <em>under ten.</em>
            </h1>
            <p className={styles.lede}>
              A satellite price calculator, an AI assistant trained on your
              business, and review automation that texts from your own cell.
              One flat price. Built by a developer who&apos;s tired of watching
              small crews lose to franchises.
            </p>
            <div className={styles.ctas}>
              <a className="rv3-btn-primary" href="#pricing">
                Start 30 days free →
              </a>
              <a className="rv3-btn-secondary" href="#tools">
                See live demo <kbd>⌘D</kbd>
              </a>
            </div>
            <div className={styles.trust}>
              <span>No credit card</span>
              <span>5-min setup</span>
              <span>Cancel any time</span>
            </div>
          </div>

          <div className={styles.rightStage}>
            <div className={styles.ring} />
            <div className={styles.dashboard}>
              <div className={styles.dashBar}>
                <div className="dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="title">RuufPro · Dashboard</span>
                <div className="live">
                  <span className="liveDot" />
                  live
                </div>
              </div>
              <div className={styles.dashBody}>
                <div className={`${styles.panel} ${styles.accent}`}>
                  <div className="h">
                    <span className="ddot" />
                    Lead captured · 11:47 PM
                  </div>
                  <div className="v">$14,200</div>
                  <div className="m">
                    Robert C. · 742 Evergreen · 2,450 sqft asphalt
                  </div>
                  <div className="stack">
                    <div className="row">
                      <span>Source</span>
                      <strong>Calculator</strong>
                    </div>
                    <div className="row">
                      <span>Phone</span>
                      <strong>(214) 555-0147</strong>
                    </div>
                    <div className="row">
                      <span>AI follow-up</span>
                      <strong>Sent · 2.4s</strong>
                    </div>
                  </div>
                </div>

                <div className={styles.colRStack}>
                  <div className={`${styles.panel} ${styles.dark}`}>
                    <div className="h">
                      <span className="ddot" />
                      AI · in your voice
                    </div>
                    <div className="v">
                      &ldquo;Insurance claims? Yes — full claim, end to end.&rdquo;
                    </div>
                    <div className="m">Replied 2.4s · 24/7 · EN + ES</div>
                  </div>

                  <div className={`${styles.panel} ${styles.push}`}>
                    <div className="icon">R</div>
                    <div className="body">
                      <div className="t">Review push · 4:00 PM</div>
                      <div className="m">
                        Sarah&apos;s job complete — tap to text from your cell.
                      </div>
                    </div>
                  </div>

                  <div className={`${styles.panel} ${styles.month}`}>
                    <div className="h">
                      <span className="ddot" />
                      This month
                    </div>
                    <div className="v">14 leads · 3 closed</div>
                    <div className="breakdown">
                      <div className="fill" />
                    </div>
                    <div className="m" style={{ marginTop: 8 }}>
                      $42K booked · 28× your $149/mo
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
