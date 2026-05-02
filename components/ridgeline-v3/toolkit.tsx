import Image from "next/image";
import { Section, Wrap, Eyebrow, Display, Lede } from "./_primitives";
import styles from "./toolkit.module.css";

const PHONE_SRC = "/ridgeline-v3/phone-cutout.png";
const ROOF_3D_SRC = "/ridgeline-v3/3d-roof-landing.png";

export function Toolkit() {
  return (
    <Section id="tools">
      <Wrap>
        <Eyebrow>The toolkit · 03 parts</Eyebrow>
        <Display>
          Three tools. <em>One dashboard.</em>
        </Display>
        <Lede>
          Each one has a single job: turn a curious homeowner into a booked
          job before your competitor finishes their voicemail outgoing
          message. No bolt-ons. No per-lead fees. No salesperson.
        </Lede>

        <div className={styles.grid}>
          {/* Tool 01 — Calculator */}
          <div className={styles.card}>
            <div>
              <div className={styles.num}>Tool 01</div>
              <h3 className={styles.h3}>The Instant Calculator</h3>
              <div className={styles.pay}>
                → Address in. Real ballpark out. Lead captured.
              </div>
              <p className={styles.body}>
                Drop one line of code on any site. Homeowners type their
                address — we pull{" "}
                <strong>photoreal 3D satellite data</strong> of their actual
                roof, measure it, and show a real ballpark price in 8 seconds.
                They get wowed; you get the lead.
              </p>
              <div className={styles.featureList}>
                <span>Photoreal 3D roof, not a wireframe — drag, zoom, look around</span>
                <span>Embeds anywhere — your site, ad landing pages, QR codes</span>
                <span>Triggers an instant AI follow-up automatically</span>
              </div>
            </div>
            <div className={styles.tv3d}>
              <div className="frame">
                <Image
                  src={ROOF_3D_SRC}
                  alt="Photoreal 3D aerial view of a roof with stats overlaid"
                  width={1400}
                  height={900}
                />
                <div className="badge">
                  <span className="dot" />
                  Live · 3D satellite
                </div>
              </div>
              <div className="caption">
                <div>
                  <div className="label">Ballpark · 2,450 sqft asphalt</div>
                  <div className="biz">8734 54th Ave E · Bradenton, FL</div>
                  <div className="meta">5/12 pitch · 8-yr roof · 3 hurricanes weathered</div>
                </div>
                <div className="price">
                  $14,200<span className="priceSub">est.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tool 02 — AI assistant */}
          <div className={`${styles.card} ${styles.reverse}`}>
            <div>
              <div className={styles.num}>Tool 02</div>
              <h3 className={styles.h3}>An AI assistant trained on your business.</h3>
              <div className={styles.pay}>→ Catches every lead while you&apos;re on a roof.</div>
              <p className={styles.body}>
                Trained on your services, your warranty, your pricing — not
                generic roofing info. Lives on your website and covers your
                missed calls. Answers questions, gives an instant ballpark
                estimate, books your callback.
              </p>
              <div className={styles.featureList}>
                <span>Answers homeowners 24/7 — English &amp; Spanish</span>
                <span>Gives an instant ballpark estimate before you call back</span>
                <span>Captures phone, address &amp; roof issue automatically</span>
              </div>
            </div>
            <div className={styles.tvPhone}>
              <Image src={PHONE_SRC} alt="iPhone showing AI assistant SMS auto-reply" width={320} height={320} />
              <div className="screen">
                <div className="convoHead">
                  <div className="nm">Mike · Ironshield Roofing</div>
                  <div className="num">(941) 555-0123</div>
                </div>
                <div className="thread">
                  <div className="ts">Today · 11:47 AM</div>
                  <div className="bubble bubbleThem">
                    Hi, looking for someone to come look at a leak in our
                    kitchen ceiling.
                  </div>
                  <div className="bubble bubbleYou">
                    Hey — sorry I missed your call! While you wait, my AI
                    assistant can answer questions or get you an instant
                    ballpark price:{" "}
                    <span className="lk">ruufpro.com/site/ironshield</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tool 03 — Review automation */}
          <div className={styles.card}>
            <div>
              <div className={styles.num}>Tool 03</div>
              <h3 className={styles.h3}>Review automation, your way.</h3>
              <div className={styles.pay}>→ You stay in control of the message.</div>
              <p className={styles.body}>
                Mark a job done. We schedule a push notification to your phone
                at the right time. You tap, it pre-fills the review request,
                you send from your own number — homeowner sees your name, not
                ours. Or turn on automated email review requests for hands-off
                mode.
              </p>
              <div className={styles.featureList}>
                <span>SMS reviews go from your cell, not a 5-digit shortcode</span>
                <span>Email follow-ups run fully automated if you want</span>
                <span>Dashboard tracks who&apos;s been asked + who replied</span>
              </div>
            </div>
            <div className={styles.tvPush}>
              <div className="nbTime">9:41</div>
              <div className="notif">
                <div className="icon">R</div>
                <div className="nbBody">
                  <div className="nbTop">
                    <div className="nbName">RuufPro</div>
                    <div className="nbWhen">4:00 PM</div>
                  </div>
                  <div className="nbMsg">
                    Sarah&apos;s job is wrapped — tap to text her a review
                    request from your cell.
                  </div>
                  <div className="actions">
                    <div className="a aDismiss">Later</div>
                    <div className="a aSend">Send →</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
