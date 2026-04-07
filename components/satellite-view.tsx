// Satellite property view with optional building outline overlay.
// Display-only — no controls, no interaction. Used in estimate widget step 2.

"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary } from "@googlemaps/js-api-loader";
import { motion } from "framer-motion";

interface SatelliteViewProps {
  lat: number;
  lng: number;
  buildingPolygon?: { lat: number; lng: number }[] | null;
}

export default function SatelliteView({
  lat,
  lng,
  buildingPolygon,
}: SatelliteViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    importLibrary("maps").then(() => {
      if (cancelled || !containerRef.current) return;

      const map = new google.maps.Map(containerRef.current, {
        center: { lat, lng },
        zoom: 17,
        mapTypeId: "satellite",
        disableDefaultUI: true,
        gestureHandling: "none",
        keyboardShortcuts: false,
        clickableIcons: false,
      });

      mapRef.current = map;

      // Zoom-in animation after map loads
      google.maps.event.addListenerOnce(map, "tilesloaded", () => {
        setMapReady(true);
        setTimeout(() => {
          map.setZoom(19);
        }, 300);
      });
    });

    return () => {
      cancelled = true;
    };
    // Only run on mount — lat/lng updates handled in the next effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when coords change (user re-selects address)
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(17);
      setTimeout(() => {
        mapRef.current?.setZoom(19);
      }, 300);
    }
  }, [lat, lng]);

  // Draw building outline polygon
  useEffect(() => {
    // Clean up previous polygon
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }

    if (!mapRef.current || !buildingPolygon?.length) return;

    const polygon = new google.maps.Polygon({
      paths: buildingPolygon,
      strokeColor: "#3B82F6",
      strokeOpacity: 0.7,
      strokeWeight: 2,
      fillColor: "#3B82F6",
      fillOpacity: 0.2,
      map: mapRef.current,
    });

    polygonRef.current = polygon;

    return () => {
      polygon.setMap(null);
    };
  }, [buildingPolygon]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 180 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="relative rounded-xl overflow-hidden"
      style={{
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow:
          "0 4px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* Map container */}
      <div ref={containerRef} className="w-full h-[180px]" />

      {/* "Your property" label */}
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
