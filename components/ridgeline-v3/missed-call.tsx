import Image from "next/image";
import { Section, Wrap, Eyebrow, Display, Lede } from "./_primitives";
import styles from "./missed-call.module.css";

const PHONE_SRC = "/ridgeline-v3/phone-cutout.png";

function StatusBar() {
  return (
    <div className={styles.statusBar}>
      <span>9:41</span>
      <div className="icons">
        <span className={styles.bar} />
        <span className={styles.batt} />
      </div>
    </div>
  );
}

export function MissedCall() {
  return (
    <Section id="missed-call">
      <Wrap>
        <Eyebrow>Missed-call recovery</Eyebrow>
        <Display>
          You&apos;re on a roof. <em>Your AI&apos;s not.</em>
        </Display>
        <Lede>
          You can&apos;t pick up every call. Your phone can. The smart link
          drops into your phone&apos;s auto-text reply — when you miss a call,
          the homeowner instantly gets a text from your number with a link to
          your AI assistant. Three things happen, in order, without you.
        </Lede>

        <div className={styles.stack}>
          {/* ───────── Stage 01 — The miss ───────── */}
          <article className={`${styles.stage} ${styles.stage01}`}>
            <div className={styles.copy}>
              <div className={styles.stageEyebrow}>
                <span className={styles.stageNum}>Stage 01</span>
                <span>The miss</span>
              </div>
              <h3 className={styles.stageH}>
                A call comes in <em>while you&apos;re on a roof.</em>
              </h3>
              <p className={styles.stageP}>
                You can&apos;t answer. The homeowner is about to tap back to
                Google and call the next roofer in the list. You have about
                eight seconds before they&apos;re gone.
              </p>
              <div className={styles.objection}>
                <div className={styles.objectionLabel}>No new phone number</div>
                <div className={styles.objectionBody}>
                  You use your existing phone, your existing carrier. We never
                  touch your line.
                </div>
              </div>
            </div>
            <div className={styles.phoneStage}>
              <div className={styles.phoneFrame}>
                <Image
                  className={styles.phoneImg}
                  src={PHONE_SRC}
                  alt="iPhone showing an incoming missed call from a homeowner"
                  width={280}
                  height={280}
                />
                <div className={styles.screen}>
                  <StatusBar />
                  <div className={styles.missScreen}>
                    <div className={styles.missIcon}>↙</div>
                    <div className={styles.missLabel}>Missed call</div>
                    <div className={styles.missNum}>(941) 555-0123</div>
                    <div className={styles.missTime}>Just now</div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* ───────── Stage 02 — The auto-reply (HERO) ───────── */}
          <article className={`${styles.stage} ${styles.stage02}`}>
            <div className={`${styles.phoneStage} ${styles.phoneStageReverse}`}>
              <div className={styles.phoneFrame}>
                <Image
                  className={styles.phoneImg}
                  src={PHONE_SRC}
                  alt="iPhone showing an automatic text reply with a link to the AI assistant"
                  width={280}
                  height={280}
                />
                <div className={styles.screen}>
                  <StatusBar />
                  <div className={styles.convoHead}>
                    <div className="nm">Mike · Ironshield Roofing</div>
                    <div className="num">(941) 555-0123</div>
                  </div>
                  <div className={styles.thread}>
                    <div className="ts">Today · 11:47 AM</div>
                    <div className="bubble them">
                      Hi, looking for a roofer for a leak repair.
                    </div>
                    <div className="bubble you">
                      Hey — sorry I missed your call! I&apos;m on a roof. While
                      you wait, my AI assistant can answer questions or get you
                      an instant ballpark price:{" "}
                      <span className="lk">ruufpro.com/site/ironshield</span>
                    </div>
                    <div className={styles.typing}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.copy}>
              <div className={styles.stageEyebrow}>
                <span className={styles.stageNum}>Stage 02</span>
                <span>The auto-reply</span>
              </div>
              <h3 className={styles.stageH}>
                Your phone <em>texts back.</em>
              </h3>
              <p className={styles.stageP}>
                A friendly text goes out from your number. The homeowner sees
                your name, not ours. They tap the link. They&apos;re inside
                your AI assistant in under fifteen seconds.
              </p>
              <div className={styles.objection}>
                <div className={styles.objectionLabel}>
                  No AI pretending to be you
                </div>
                <div className={styles.objectionBody}>
                  Your phone auto-texts. The homeowner taps the link. The AI
                  takes it from there — over chat, never voice.
                </div>
              </div>
            </div>
          </article>

          {/* ───────── Stage 03 — The qualified lead ───────── */}
          <article className={`${styles.stage} ${styles.stage03}`}>
            <div className={styles.copy}>
              <div className={styles.stageEyebrow}>
                <span className={styles.stageNum}>Stage 03</span>
                <span>The qualified lead</span>
              </div>
              <h3 className={styles.stageH}>
                The AI does the <em>qualifying.</em>
              </h3>
              <p className={styles.stageP}>
                It asks the right questions, captures the address, gives an
                instant ballpark, books your callback — all while you finish
                the job. By the time you&apos;re down, the lead is on your
                dashboard, ready to close.
              </p>
              <div className={styles.objection}>
                <div className={styles.objectionLabel}>5-minute setup</div>
                <div className={styles.objectionBody}>
                  Copy your smart link from the dashboard → paste into your
                  iPhone or Android auto-reply. Done.
                </div>
              </div>
            </div>
            <div className={styles.phoneStage}>
              <div className={styles.phoneFrame}>
                <Image
                  className={styles.phoneImg}
                  src={PHONE_SRC}
                  alt="iPhone showing the AI assistant qualifying the homeowner and booking a callback"
                  width={280}
                  height={280}
                />
                <div className={styles.screen}>
                  <StatusBar />
                  <div className={styles.aiBar}>
                    <div className="av">A</div>
                    <div className="nm">Ironshield · AI</div>
                    <div className="live">live</div>
                  </div>
                  <div className={styles.chat}>
                    <div className="b ans">
                      Hey! What&apos;s going on with your roof?
                    </div>
                    <div className="b ask">Active leak in the kitchen ceiling</div>
                    <div className="b ans">
                      Got it — what&apos;s the address? We&apos;ll pull
                      satellite imagery.
                    </div>
                    <div className="b ask">742 Evergreen Terrace</div>
                    <div className="b ans">
                      Thanks. We can have someone out tomorrow morning. Sound
                      good?
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </Wrap>
    </Section>
  );
}
