"use client";

// ProjectGallery — grid of project photos with lightbox.
// Shows 4-6 high-quality roof images. Click to expand.
// Falls back to placeholder grid if no photos uploaded.

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Theme {
  bg?: string;
  bgWarm?: string;
  text?: string;
  textSecondary?: string;
  accent?: string;
  fontDisplay?: string;
  fontBody?: string;
  sectionPadding?: string;
  maxWidth?: string;
  borderRadius?: string;
}

interface ProjectGalleryProps {
  theme: Theme;
  isDark?: boolean;
  photos?: string[]; // array of image URLs
  businessName: string;
}

const PLACEHOLDER_LABELS = [
  "Completed Roof — Architectural Shingles",
  "Storm Damage Repair",
  "Metal Roof Installation",
  "Full Roof Replacement",
  "Gutter & Flashing Detail",
  "Before & After",
];

export default function ProjectGallery({
  theme,
  isDark = false,
  photos = [],
  businessName,
}: ProjectGalleryProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Don't render section if no photos — avoids showing placeholder/admin text to visitors
  if (!photos || photos.length === 0) return null;

  const textColor = isDark ? "#FFFFFF" : (theme.text || "#1A1A2E");
  const mutedColor = isDark ? "rgba(255,255,255,0.5)" : (theme.textSecondary || "#666");
  const accentColor = theme.accent || "#E8722A";
  const borderColor = isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB";

  const hasPhotos = photos.length > 0;
  const displayCount = Math.min(hasPhotos ? photos.length : 6, 6);

  return (
    <>
      <section style={{
        padding: theme.sectionPadding || "80px 32px",
        fontFamily: theme.fontBody,
      }}>
        <div style={{ maxWidth: theme.maxWidth || "1100px", margin: "0 auto" }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <p style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: accentColor,
              marginBottom: 12,
            }}>
              Our Work
            </p>
            <h2 style={{
              fontFamily: theme.fontDisplay,
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              color: textColor,
              margin: 0,
            }}>
              Recent Projects
            </h2>
          </motion.div>

          {/* Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}>
            {Array.from({ length: displayCount }).map((_, i) => {
              const photoUrl = hasPhotos ? photos[i] : null;
              const label = PLACEHOLDER_LABELS[i] || `Project ${i + 1}`;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  onClick={() => photoUrl && setLightbox(photoUrl)}
                  style={{
                    aspectRatio: i === 0 || i === 5 ? "4/3" : "1/1",
                    gridColumn: i === 0 ? "span 2" : i === 5 ? "span 2" : "span 1",
                    borderRadius: theme.borderRadius || "12px",
                    overflow: "hidden",
                    cursor: photoUrl ? "pointer" : "default",
                    position: "relative",
                    border: `1px solid ${borderColor}`,
                    background: isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6",
                  }}
                >
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={label}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      loading="lazy"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: mutedColor,
                      fontSize: 13,
                      textAlign: "center",
                      padding: 16,
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📷</div>
                      {label}
                    </div>
                  )}

                  {/* Hover overlay */}
                  {photoUrl && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.3)",
                      opacity: 0,
                      transition: "opacity 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFF",
                      fontSize: 24,
                    }}
                      onMouseEnter={(e) => { (e.target as HTMLDivElement).style.opacity = "1"; }}
                      onMouseLeave={(e) => { (e.target as HTMLDivElement).style.opacity = "0"; }}
                    >
                      ⤢
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* No photos message */}
          {!hasPhotos && (
            <p style={{
              textAlign: "center",
              color: mutedColor,
              fontSize: 13,
              marginTop: 16,
            }}>
              Upload your project photos in Dashboard → Settings to showcase your work.
            </p>
          )}
        </div>

        <style>{`
          @media (max-width: 768px) {
            section > div > div:last-of-type { grid-template-columns: 1fr 1fr !important; }
            section > div > div:last-of-type > div { grid-column: span 1 !important; aspect-ratio: 1/1 !important; }
          }
        `}</style>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0,0,0,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              padding: 32,
            }}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightbox}
              alt="Project photo"
              style={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                objectFit: "contain",
                borderRadius: 8,
              }}
            />
            <div style={{
              position: "absolute",
              top: 24,
              right: 32,
              color: "#FFF",
              fontSize: 28,
              cursor: "pointer",
              opacity: 0.7,
            }}>
              ✕
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
