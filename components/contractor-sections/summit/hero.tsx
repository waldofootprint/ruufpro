"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface SummitHeroProps {
  businessName: string;
  city: string;
  phone: string;
  heroHeadline?: string;
  tagline?: string;
  heroCta?: string;
  heroImage?: string | null;
  hasEstimateWidget?: boolean;
  yearsInBusiness?: number;
}

const FRAME_COUNT = 100;
const FRAME_PATH = "/animations/roof-layers/frame_";

export default function SummitHero({
  businessName,
  city,
  phone,
  heroHeadline,
  tagline,
  heroCta = "Get Your Free Estimate",
  hasEstimateWidget,
  yearsInBusiness,
}: SummitHeroProps) {
  const headline = heroHeadline || `Trusted Roofing in ${city}`;
  const sub =
    tagline ||
    `Licensed, insured, and proudly serving ${city} homeowners${
      yearsInBusiness ? ` for ${yearsInBusiness}+ years` : ""
    }.`;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const tickingRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  // Preload all frames
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = `${FRAME_PATH}${String(i).padStart(4, "0")}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          framesRef.current = images;
          setLoaded(true);
          drawFrame(0);
        }
      };
      images.push(img);
    }
  }, []);

  // Draw a frame with contain-fit (centered, no crop)
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // Contain-fit: scale to fit inside canvas, center it
    const imgRatio = img.width / img.height;
    const canvasRatio = cw / ch;
    let drawW: number, drawH: number;

    if (canvasRatio > imgRatio) {
      drawH = ch;
      drawW = ch * imgRatio;
    } else {
      drawW = cw;
      drawH = cw / imgRatio;
    }

    const drawX = (cw - drawW) / 2;
    const drawY = (ch - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }, []);

  // Resize canvas for retina
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    if (loaded) drawFrame(currentFrameRef.current);
  }, [loaded, drawFrame]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Scroll → frame mapping
  useEffect(() => {
    if (!loaded) return;

    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        const section = sectionRef.current;
        if (!section) {
          tickingRef.current = false;
          return;
        }

        const rect = section.getBoundingClientRect();
        const scrollable = section.offsetHeight - window.innerHeight;
        const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
        const frameIndex = Math.min(
          FRAME_COUNT - 1,
          Math.floor(progress * FRAME_COUNT)
        );

        if (frameIndex !== currentFrameRef.current) {
          currentFrameRef.current = frameIndex;
          drawFrame(frameIndex);
        }

        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loaded, drawFrame]);

  return (
    <>
      {/* Scroll container — height controls animation speed */}
      <section
        ref={sectionRef}
        style={{
          height: "350vh",
          position: "relative",
          background: "#F5F3F0",
        }}
      >
        {/* Sticky viewport */}
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            width: "100%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Warm neutral gradient orbs */}
          <div
            style={{
              position: "absolute",
              top: "-20%",
              right: "-5%",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(140,120,95,0.06) 0%, transparent 70%)",
              animation: "heroOrbDrift 22s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />

          {/* Split layout: content left, canvas right */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              maxWidth: 1400,
              margin: "0 auto",
              padding: "0 40px",
              gap: 40,
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Left: text content */}
            <div style={{ flex: "0 0 45%", maxWidth: 560 }}>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 16px",
                  borderRadius: 100,
                  background: "rgba(90,75,60,0.08)",
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#22C55E",
                    animation: "badgePulse 2.5s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#6B5E4F",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  {yearsInBusiness
                    ? `Serving ${city} Since ${new Date().getFullYear() - yearsInBusiness}`
                    : `Trusted in ${city}`}
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                  color: "#1A1612",
                  margin: "0 0 18px",
                }}
              >
                {headline}
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "1.08rem",
                  lineHeight: 1.7,
                  color: "#6B5E4F",
                  margin: "0 0 32px",
                }}
              >
                {sub} Get an instant estimate in 30 seconds — no phone call
                needed.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.55 }}
                style={{
                  display: "flex",
                  gap: 14,
                  flexWrap: "wrap" as const,
                }}
              >
                <a
                  href={hasEstimateWidget ? "#estimate" : "#contact"}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "15px 30px",
                    borderRadius: 10,
                    background: "#3D3228",
                    color: "#fff",
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    textDecoration: "none",
                    border: "none",
                    cursor: "pointer",
                    boxShadow:
                      "0 4px 20px rgba(61,50,40,0.2), 0 1px 3px rgba(61,50,40,0.1)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#2A231C";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 30px rgba(61,50,40,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#3D3228";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 20px rgba(61,50,40,0.2), 0 1px 3px rgba(61,50,40,0.1)";
                  }}
                >
                  {heroCta}
                  <span style={{ fontSize: "1rem" }}>→</span>
                </a>

                <a
                  href={`tel:${phone.replace(/\D/g, "")}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "15px 30px",
                    borderRadius: 10,
                    background: "transparent",
                    color: "#3D3228",
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    textDecoration: "none",
                    border: "1px solid rgba(61,50,40,0.15)",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#3D3228";
                    e.currentTarget.style.background = "rgba(61,50,40,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(61,50,40,0.15)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  📞 {phone}
                </a>
              </motion.div>

              {/* Scroll hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                style={{
                  marginTop: 48,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#9A8E80",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    animation: "scrollBounce 2s ease-in-out infinite",
                  }}
                >
                  ↓
                </span>
                Scroll to explore
              </motion.div>
            </div>

            {/* Right: canvas animation */}
            <div
              style={{
                flex: "1 1 55%",
                height: "80vh",
                position: "relative",
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                }}
              />
              {!loaded && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9A8E80",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  Loading...
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        @keyframes heroOrbDrift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 20px); }
        }
        @keyframes badgePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        @media (max-width: 768px) {
          section > div > div > div {
            flex-direction: column-reverse !important;
          }
          section > div > div > div > div:first-child {
            flex: 1 !important;
            text-align: center;
          }
          section > div > div > div > div:last-child {
            height: 50vh !important;
            flex: none !important;
          }
        }
      `}</style>
    </>
  );
}
