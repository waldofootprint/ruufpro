// Geocode an address and return building outline polygon if available.
// Uses Google Geocoding API with extra_computations=BUILDING_AND_ENTRANCES.
// Called at address selection time (step 2) to show satellite view with roof outline.

import { NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_API_KEY!;

interface BuildingOutline {
  polygon: { lat: number; lng: number }[];
}

export async function POST(req: Request) {
  try {
    const { address, lat, lng } = await req.json();

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    // Forward geocode with building outline — uses the address string
    // (reverse geocode with latlng picks up wrong nearby structures)
    let polygon: BuildingOutline["polygon"] | null = null;
    let finalLat = lat;
    let finalLng = lng;

    try {
      const buildingUrl =
        `https://maps.googleapis.com/maps/api/geocode/json` +
        `?address=${encodeURIComponent(address)}` +
        `&extra_computations=BUILDING_AND_ENTRANCES` +
        `&key=${API_KEY}`;

      const buildingRes = await fetch(buildingUrl);
      const buildingData = await buildingRes.json();

      if (buildingData.status === "OK" && buildingData.results?.length) {
        const result = buildingData.results[0];

        // Use the geocoded lat/lng if we don't already have coords
        if (!finalLat || !finalLng) {
          finalLat = result.geometry.location.lat;
          finalLng = result.geometry.location.lng;
        }

        // Extract building outline
        const buildings = result.buildings;
        if (buildings?.length) {
          const outline = buildings[0]?.building_outlines?.[0];
          if (outline?.display_polygon?.coordinates?.[0]) {
            // GeoJSON format: [[lng, lat], ...] → Google Maps format: [{lat, lng}, ...]
            polygon = outline.display_polygon.coordinates[0].map(
              (coord: number[]) => ({
                lat: coord[1],
                lng: coord[0],
              })
            );
          }
        }
      }
    } catch (e) {
      console.log("Building outline unavailable:", e);
    }

    // If geocoding failed and we have no coords at all, return null
    if (!finalLat || !finalLng) {
      return NextResponse.json({ lat: null, lng: null, polygon: null });
    }

    return NextResponse.json({
      lat: finalLat,
      lng: finalLng,
      polygon,
    });
  } catch (error) {
    console.error("Geocode building error:", error);
    return NextResponse.json(
      { error: "Geocoding failed" },
      { status: 500 }
    );
  }
}
