import Image from "next/image";
import { Section, Wrap, Eyebrow, Display, Lede } from "./_primitives";
import styles from "./marketing-everywhere.module.css";

const TRUCK_SRC = "/ridgeline-v3/truck-cutout.png";

export function MarketingEverywhere() {
  return (
    <Section variant="deep">
      <Wrap>
        <Eyebrow>Upgrade your marketing</Eyebrow>
        <Display>
          Use your calculator <em>anywhere.</em>
        </Display>
        <Lede>
          Lead capture made easy. Your Instant Estimator is a link, an embed,
          a QR code — drop it into any marketing material and you stop losing
          curious homeowners. One Roofr customer put QR codes on balloons.
          We&apos;re not even kidding.
        </Lede>

        {/* Top setup card with email-embed-code mock (build vs strip TBD) */}
        <div className={styles.setup}>
          <div className={styles.setupCopy}>
            <div className={styles.setupLab}>Setup · Dead simple</div>
            <h3 className={styles.setupH}>
              One line of code. <em>Your site, transformed.</em>
            </h3>
            <p className={styles.setupP}>
              You don&apos;t have to touch any code yourself. From your
              dashboard, hit one button to email the embed snippet straight to
              whoever runs your site. They paste it once. The calculator&apos;s
              live.
            </p>
            <div className={styles.steps}>
              <span className={styles.s1}>
                Open RuufPro · click <strong>Email Embed Code</strong>
              </span>
              <span className={styles.s2}>
                Type your developer&apos;s email · hit send
              </span>
              <span className={styles.s3}>
                They paste, you&apos;re live — usually same day
              </span>
            </div>
          </div>
          <div className={styles.demo}>
            <div className={styles.dashMock}>
              <div className={styles.dashMockTop}>
                <div className="dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="ttl">RuufPro · Settings · Estimate Widget</span>
              </div>
              <div className={styles.dashMockBody}>
                <div className="h">Embed Code</div>
                <h6>Drop it on any site</h6>
                <p>WordPress, Wix, Squarespace, custom — all work.</p>
                <div className={styles.code}>
                  &lt;<span className="key">script</span>{" "}
                  <span className="key">src</span>=
                  <span className="str">&quot;ruufpro.com/w/ironshield.js&quot;</span>
                  &gt;&lt;/<span className="key">script</span>&gt;
                </div>
                <div className={styles.sendRow}>
                  <div className={styles.input}>
                    developer@ironshield-roofing.com
                  </div>
                  <div className={styles.sendBtn}>→ Send code</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bento — places to put your calculator */}
        <div className={styles.bento}>
          <div className={`${styles.tile} ${styles.truck}`}>
            <div>
              <div className={styles.tileLab}>On your trucks</div>
              <h4 className={`${styles.tileH} ${styles.truckH}`}>
                Drive past every house in town with a working storefront on
                the side.
              </h4>
              <p className={styles.tileP}>
                Wrap a QR code on the door. Anyone who walks past your truck
                can scan and get a price in 8 seconds — without ever calling.
              </p>
            </div>
            <div className={styles.truckStage}>
              <Image
                className={styles.truckImg}
                src={TRUCK_SRC}
                alt="Pickup truck with QR-code, logo and phone-number decals"
                width={540}
                height={240}
              />
            </div>
          </div>

          <div className={`${styles.tile} ${styles.doors}`}>
            <div>
              <div className={styles.tileLab}>On door hangers</div>
              <h4 className={styles.tileH}>Hand-deliver an estimate.</h4>
              <p className={styles.tileP}>
                Drop a hanger after a storm sweep. Homeowner scans, gets a
                price, books the inspection — without you knocking twice.
              </p>
            </div>
            <div className={styles.doorhanger}>
              <div className="biz">IRONSHIELD ROOFING</div>
              <div className="pitch">
                Storm came through? Get a free instant estimate.
              </div>
              <div className="scan">— Scan to estimate —</div>
              <div className="qr" />
            </div>
          </div>

          <div className={`${styles.tile} ${styles.cards}`}>
            <div>
              <div className={styles.tileLab}>On business cards</div>
              <h4 className={styles.tileH}>Hand someone a price, not a number.</h4>
              <p className={styles.tileP}>
                Every card you hand out becomes a working calculator. They
                scan; you get the lead.
              </p>
            </div>
            <div className={styles.cardStack}>
              <div className={`${styles.bizcard} ${styles.bizcardB1}`}>
                <div>
                  <div className="cardBiz">IRONSHIELD ROOFING</div>
                  <div className="cardRole">Owner</div>
                  <div className="cardMeta">(941) 555-0123</div>
                </div>
                <div className="qrX" />
              </div>
              <div className={`${styles.bizcard} ${styles.bizcardB2}`}>
                <div>
                  <div className="cardBiz">IRONSHIELD ROOFING</div>
                  <div className="cardRole">Mike Stevens · Owner</div>
                  <div className="cardMeta">(941) 555-0123 · ironshield.com</div>
                </div>
                <div className="qrX" />
              </div>
            </div>
          </div>

          <div className={`${styles.tile} ${styles.balloons}`}>
            <div>
              <div className={styles.tileLab}>On balloons. Yes, balloons.</div>
              <h4 className={styles.tileH}>
                Anywhere a homeowner can scan, your calculator can capture.
              </h4>
              <p className={styles.tileP}>
                Trade shows · job-site signs · neighborhood mailers · the side
                of a balloon. One Roofr customer did balloons. We&apos;re not
                making it up.
              </p>
            </div>
            <div className={styles.balloonRow}>
              <div className={styles.balloon}>
                <div className={styles.qrTiny} />
              </div>
              <div className={styles.balloon}>
                <div className={styles.qrTiny} />
              </div>
              <div className={styles.balloon}>
                <div className={styles.qrTiny} />
              </div>
            </div>
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
