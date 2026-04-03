"use client";

// Scroll-Driven Frame Animation — Premium Hero Component
// Supports: glass card overlay, multiple text milestones, gradient edge masking,
// CTA at start + end, full-bleed mode, mobile static fallback, progressive loading

import { useEffect, useRef, useState, useCallback } from "react";

interface TextMilestone {
  text: string;
  startProgress: number; // 0-1, when to start fading in
  endProgress: number; // 0-1, when to finish fading out
  style?: "headline" | "subheadline" | "label";
}

interface ScrollAnimationProps {
  framePath: string;
  frameCount: number;
  scrollHeight?: string;
  bgColor?: string;
  accentColor?: string;
  fontDisplay?: string;
  fontBody?: string;
  // Glass card
  glassCardHeadline?: string;
  glassCardSubheadline?: string;
  glassCardCta?: string;
  onCtaClick?: () => void;
  // Scroll to element by ID on CTA click (server-component safe alternative to onCtaClick)
  ctaScrollTarget?: string;
  // Text milestones during scroll
  milestones?: TextMilestone[];
  // End CTA
  endCtaText?: string;
  // Full-bleed mode (for hero usage)
  fullBleed?: boolean;
  // Mobile fallback
  mobileStaticImage?: string;
  // Gradient mask edges
  gradientMask?: boolean;
}

export default function ScrollAnimation({
  framePath,
  frameCount,
  scrollHeight = "300vh",
  bgColor = "#F7F8FA",
  accentColor = "#1E3A5F",
  fontDisplay = "'Sora', system-ui, sans-serif",
  fontBody = "'DM Sans', system-ui, sans-serif",
  glassCardHeadline,
  glassCardSubheadline,
  glassCardCta = "Get Your Free Estimate",
  onCtaClick,
  ctaScrollTarget,
  milestones = [],
  endCtaText,
  fullBleed = false,
  mobileStaticImage,
  gradientMask = true,
}: ScrollAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [loaded, setLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const handleCtaClick = useCallback(() => {
    if (onCtaClick) return onCtaClick();
    if (ctaScrollTarget) {
      document.getElementById(ctaScrollTarget)?.scrollIntoView({ behavior: "smooth" });
    }
  }, [onCtaClick, ctaScrollTarget]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getFrameUrl = useCallback(
    (index: number) => {
      const padded = String(index).padStart(4, "0");
      return `${framePath}/frame-${padded}.jpg`;
    },
    [framePath]
  );

  // Progressive preloading — playable at 30 frames, full load continues in background
  useEffect(() => {
    if (isMobile && mobileStaticImage) return; // Skip loading frames on mobile

    let loadedCount = 0;
    const images: HTMLImageElement[] = new Array(frameCount);
    const PLAYABLE_THRESHOLD = Math.min(30, frameCount);

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      if (i < 10) (img as any).fetchPriority = "high";
      img.src = getFrameUrl(i + 1);
      img.onload = () => {
        loadedCount++;
        setLoadProgress(Math.round((loadedCount / frameCount) * 100));
        // Start playback once enough frames are loaded
        if (loadedCount >= PLAYABLE_THRESHOLD && !loaded) {
          setLoaded(true);
          drawFrame(0);
        }
      };
      images[i] = img;
    }

    imagesRef.current = images;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, getFrameUrl, isMobile, mobileStaticImage]);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imagesRef.current[index];
    if (!canvas || !ctx || !img || !img.complete) return;

    if (
      canvas.width !== img.naturalWidth ||
      canvas.height !== img.naturalHeight
    ) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const handleScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const containerHeight = container.offsetHeight;
        const viewportHeight = window.innerHeight;
        const scrollableDistance = containerHeight + viewportHeight;
        const scrolled = viewportHeight - rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance));

        setScrollProgress(progress);

        const frameIndex = Math.min(
          frameCount - 1,
          Math.floor(progress * frameCount)
        );

        if (frameIndex !== currentFrameRef.current) {
          currentFrameRef.current = frameIndex;
          drawFrame(frameIndex);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loaded, frameCount, drawFrame]);

  // Glass card opacity: visible at start, fades out 0-15%
  const glassCardOpacity = Math.max(0, 1 - scrollProgress * 6.67);

  // End CTA: fades in at 85-95%
  const endCtaOpacity = endCtaText
    ? Math.max(0, Math.min(1, (scrollProgress - 0.85) * 10))
    : 0;

  // Milestone opacity calculator
  const getMilestoneOpacity = (m: TextMilestone) => {
    if (scrollProgress < m.startProgress) return 0;
    if (scrollProgress > m.endProgress) return 0;
    // Fade in over first 20% of range
    const range = m.endProgress - m.startProgress;
    const fadeInEnd = m.startProgress + range * 0.2;
    const fadeOutStart = m.endProgress - range * 0.2;
    if (scrollProgress < fadeInEnd) {
      return (scrollProgress - m.startProgress) / (fadeInEnd - m.startProgress);
    }
    if (scrollProgress > fadeOutStart) {
      return (m.endProgress - scrollProgress) / (m.endProgress - fadeOutStart);
    }
    return 1;
  };

  // --- MOBILE FALLBACK ---
  if (isMobile && mobileStaticImage) {
    return (
      <div
        style={{
          position: "relative",
          minHeight: "85vh",
          background: bgColor,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px 40px",
          overflow: "hidden",
        }}
      >
        {/* Static image */}
        <img
          src={mobileStaticImage}
          alt="Premium roof"
          style={{
            width: "100%",
            maxWidth: 500,
            height: "auto",
            objectFit: "contain",
          }}
        />

        {/* Glass card overlay */}
        {glassCardHeadline && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: 20,
              padding: "32px 28px",
              textAlign: "center",
              maxWidth: "85%",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
            }}
          >
            <h1
              style={{
                fontFamily: fontDisplay,
                fontSize: "clamp(24px, 6vw, 36px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "#1A1A2E",
                margin: "0 0 8px",
              }}
            >
              {glassCardHeadline}
            </h1>
            {glassCardSubheadline && (
              <p
                style={{
                  fontFamily: fontBody,
                  fontSize: 15,
                  color: "#5A5A6E",
                  margin: "0 0 20px",
                  lineHeight: 1.5,
                }}
              >
                {glassCardSubheadline}
              </p>
            )}
            <button
              onClick={handleCtaClick}
              style={{
                fontFamily: fontDisplay,
                fontSize: 15,
                fontWeight: 700,
                padding: "14px 28px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: "#E8720C",
                color: "#fff",
                letterSpacing: "-0.01em",
                boxShadow: "0 4px 14px rgba(232, 114, 12, 0.3)",
              }}
            >
              {glassCardCta}
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- DESKTOP: Full scroll animation ---
  return (
    <div
      ref={containerRef}
      style={{
        height: scrollHeight,
        position: "relative",
        background: bgColor,
      }}
    >
      {/* Thin scroll progress bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          height: 2,
          background: "transparent",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${scrollProgress * 100}%`,
            background: accentColor,
            opacity:
              loaded && scrollProgress > 0.01 && scrollProgress < 0.99
                ? 0.5
                : 0,
            transition: "opacity 0.3s ease",
          }}
        />
      </div>

      {/* Sticky viewport */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Loading state */}
        {!loaded && (
          <div
            style={{
              position: "absolute",
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 120,
                height: 2,
                background: `${accentColor}15`,
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${loadProgress}%`,
                  height: "100%",
                  background: accentColor,
                  borderRadius: 1,
                  transition: "width 0.15s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                fontFamily: fontBody,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: "#999",
              }}
            >
              {loadProgress}%
            </span>
          </div>
        )}

        {/* Canvas — full-bleed or constrained */}
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: fullBleed ? "100%" : "90%",
            maxHeight: fullBleed ? "100vh" : "75vh",
            width: fullBleed ? "100%" : undefined,
            height: fullBleed ? "100vh" : undefined,
            objectFit: "contain",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)",
            ...(gradientMask
              ? {
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 4%, black 96%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, black 4%, black 96%, transparent 100%)",
                }
              : {}),
          }}
        />

        {/* Glass card overlay — fades out as scroll begins */}
        {loaded && glassCardHeadline && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, calc(-50% + ${(1 - glassCardOpacity) * 30}px))`,
              background: "rgba(255, 255, 255, 0.82)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRadius: 24,
              padding: "40px 36px",
              textAlign: "center",
              maxWidth: 520,
              width: "90%",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              boxShadow: "0 8px 40px rgba(0, 0, 0, 0.06)",
              opacity: glassCardOpacity,
              pointerEvents: glassCardOpacity > 0.3 ? "auto" : "none",
              zIndex: 10,
              transition: "transform 0.1s ease",
            }}
          >
            <h1
              style={{
                fontFamily: fontDisplay,
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "#1A1A2E",
                margin: "0 0 10px",
              }}
            >
              {glassCardHeadline}
            </h1>
            {glassCardSubheadline && (
              <p
                style={{
                  fontFamily: fontBody,
                  fontSize: "clamp(14px, 1.5vw, 17px)",
                  color: "#5A5A6E",
                  margin: "0 0 24px",
                  lineHeight: 1.5,
                }}
              >
                {glassCardSubheadline}
              </p>
            )}
            <button
              onClick={handleCtaClick}
              style={{
                fontFamily: fontDisplay,
                fontSize: 15,
                fontWeight: 700,
                padding: "14px 32px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: "#E8720C",
                color: "#fff",
                letterSpacing: "-0.01em",
                boxShadow: "0 4px 16px rgba(232, 114, 12, 0.35)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(232, 114, 12, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(232, 114, 12, 0.35)";
              }}
            >
              {glassCardCta}
            </button>
            {/* Scroll indicator below card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 20,
                opacity: 0.45,
              }}
            >
              <svg
                width="16"
                height="24"
                viewBox="0 0 16 24"
                fill="none"
              >
                <rect
                  x="1"
                  y="1"
                  width="14"
                  height="22"
                  rx="7"
                  stroke={accentColor}
                  strokeWidth="1.5"
                />
                <circle cx="8" cy="8" r="2" fill={accentColor}>
                  <animate
                    attributeName="cy"
                    values="7;14;7"
                    dur="1.8s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.33 0 0.67 1;0.33 0 0.67 1"
                  />
                  <animate
                    attributeName="opacity"
                    values="1;0.3;1"
                    dur="1.8s"
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.33 0 0.67 1;0.33 0 0.67 1"
                  />
                </circle>
              </svg>
              <span
                style={{
                  fontFamily: fontBody,
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  color: accentColor,
                }}
              >
                Scroll to explore
              </span>
            </div>
          </div>
        )}

        {/* Text milestones — fade in/out at specified scroll positions */}
        {loaded &&
          milestones.map((m, i) => {
            const opacity = getMilestoneOpacity(m);
            if (opacity <= 0) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  bottom: m.style === "label" ? "15vh" : "10vh",
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "center",
                  opacity,
                  transform: `translateY(${(1 - opacity) * 16}px)`,
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              >
                {m.style === "label" ? (
                  <span
                    style={{
                      fontFamily: fontBody,
                      fontSize: "clamp(12px, 1.5vw, 14px)",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase" as const,
                      color: accentColor,
                      background: "rgba(255, 255, 255, 0.8)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      padding: "8px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(255, 255, 255, 0.5)",
                    }}
                  >
                    {m.text}
                  </span>
                ) : (
                  <p
                    style={{
                      fontFamily:
                        m.style === "headline" ? fontDisplay : fontBody,
                      fontSize:
                        m.style === "headline"
                          ? "clamp(20px, 3vw, 32px)"
                          : "clamp(14px, 2vw, 18px)",
                      fontWeight: m.style === "headline" ? 700 : 400,
                      letterSpacing:
                        m.style === "headline" ? "-0.02em" : "0",
                      lineHeight: 1.3,
                      color: m.style === "headline" ? accentColor : "#555",
                      margin: 0,
                      textAlign: "center",
                      maxWidth: "52ch",
                      padding: "0 20px",
                    }}
                  >
                    {m.text}
                  </p>
                )}
              </div>
            );
          })}

        {/* End CTA — fades in at 85%+ scroll */}
        {loaded && endCtaText && (
          <div
            style={{
              position: "absolute",
              bottom: "10vh",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              opacity: endCtaOpacity,
              transform: `translateY(${(1 - endCtaOpacity) * 20}px)`,
              pointerEvents: endCtaOpacity > 0.3 ? "auto" : "none",
              zIndex: 10,
              transition: "transform 0.15s ease",
            }}
          >
            <button
              onClick={handleCtaClick}
              style={{
                fontFamily: fontDisplay,
                fontSize: 16,
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: "#E8720C",
                color: "#fff",
                letterSpacing: "-0.01em",
                boxShadow: "0 4px 20px rgba(232, 114, 12, 0.35)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(232, 114, 12, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(232, 114, 12, 0.35)";
              }}
            >
              {endCtaText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
