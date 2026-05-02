import styles from "./marquee.module.css";

/* Audit P2: scrolling-marquee → static one-line meta strip. Less is more. */
export function MetaStrip() {
  return (
    <div className={styles.marquee}>
      <div className={styles.line}>
        <span>One flat price</span>
        <span>14-day free trial</span>
        <span>No per-lead fees</span>
        <span>Built in Bradenton, FL</span>
      </div>
    </div>
  );
}
