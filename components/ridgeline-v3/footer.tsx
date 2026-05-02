import styles from "./footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <div className={styles.cols}>
          <div className={`${styles.col} ${styles.brandCol}`}>
            <div className={styles.wordmark}>
              <span className={styles.mark}>R</span>RuufPro
            </div>
            <div className={styles.built}>Built in Bradenton · v1.0</div>
            <p>The lead engine for solo roofers and crews under ten.</p>
            <div className={styles.address}>
              Feedback Footprint LLC
              <br />
              8734 54th Ave E
              <br />
              Bradenton, FL 34211
            </div>
          </div>

          <div className={styles.col}>
            <h5>Product</h5>
            <ul>
              <li>Instant Calculator</li>
              <li>AI assistant</li>
              <li>Missed-call recovery</li>
              <li>Review automation</li>
              <li>Lead dashboard</li>
            </ul>
          </div>

          <div className={styles.col}>
            <h5>Company</h5>
            <ul>
              <li>About</li>
              <li>Pricing</li>
              <li>The Update</li>
              <li>Changelog</li>
              <li>
                <a href="mailto:hannah@ruufpro.com">Contact</a>
              </li>
            </ul>
          </div>

          <div className={styles.col}>
            <h5>Legal</h5>
            <ul>
              <li>Privacy</li>
              <li>Terms</li>
              <li>Security</li>
            </ul>
          </div>
        </div>

        <div className={styles.infraStrip}>
          <span className={styles.infraLabel}>Built with</span>
          <div className={styles.infraStack}>
            <span>Stripe</span>
            <span>Supabase</span>
            <span>Vercel</span>
            <span>Anthropic</span>
          </div>
          <a className={styles.statusLink} href="/api/health">
            <span className={styles.statusDot} />
            All systems operational
          </a>
        </div>

        <div className={styles.metaBar}>
          <div>© 2026 Feedback Footprint LLC · DBA RuufPro</div>
          <div>
            <a href="mailto:hannah@ruufpro.com">hannah@ruufpro.com</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
