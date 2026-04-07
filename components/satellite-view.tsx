// Satellite property view — display-only, no controls.
// Used in estimate widget step 2 after address selection.

"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary } from "@googlemaps/js-api-loader";
import { motion } from "framer-motion";

interface SatelliteViewProps {
  lat: number;
  lng: number;
}

export default function SatelliteView({
  lat,
  lng,
}: SatelliteViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    importLibrary("maps").then(() => {
      if (cancelled || !containerRef.current) return;

      const map = new google.maps.Map(containerRef.current, {
        center: { lat, lng },
        zoom: 19,
        mapTypeId: "satellite",
        disableDefaultUI: true,
        gestureHandling: "none",
        keyboardShortcuts: false,
        clickableIcons: false,
      });

      mapRef.current = map;

      google.maps.event.addListenerOnce(map, "tilesloaded", () => {
        setMapReady(true);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 180 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative rounded-xl overflow-hidden"
      style={{
        border: "1px solid rgba(0,0,0,0.12)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div ref={containerRef} className="w-full h-[180px]" />

      {mapReady && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
          style={{
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(8px)",
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.02em",
          }}
        >
          Your property
        </motion.div>
      )}
    </motion.div>
  );
}
