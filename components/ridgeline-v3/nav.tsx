import styles from "./nav.module.css";

export function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.wrap}>
        <a className={styles.wordmark} href="#top">
          <span className={styles.mark}>R</span>RuufPro
        </a>

        <div className={styles.navCard}>
          <nav>
            <a href="#update">The Update</a>
            <a href="#tools">Tools</a>
            <a href="#missed-call">Missed Calls</a>
            <a href="#pricing">Pricing</a>
          </nav>
        </div>

        <a className={styles.ctaMini} href="#pricing">
          Start free trial →
        </a>

        {/* Mobile hamburger — collapses nav links + CTA at <720px */}
        <button className={styles.hamburger} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
