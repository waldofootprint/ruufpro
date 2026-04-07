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

    // If we already have coords (from Places getDetails), try building outline directly
    // Otherwise geocode first
    let finalLat = lat;
    let finalLng = lng;

    if (!finalLat || !finalLng) {
      const geoUrl =
        `https://maps.googleapis.com/maps/api/geocode/json` +
        `?address=${encodeURIComponent(address)}` +
        `&key=${API_KEY}`;

      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (geoData.status !== "OK" || !geoData.results?.length) {
        return NextResponse.json({ lat: null, lng: null, polygon: null });
      }

      finalLat = geoData.results[0].geometry.location.lat;
      finalLng = geoData.results[0].geometry.location.lng;
    }

    // Try to get building outline via Geocoding API with extra_computations
    let polygon: BuildingOutline["polygon"] | null = null;

    try {
      const buildingUrl =
        `https://maps.googleapis.com/maps/api/geocode/json` +
        `?latlng=${finalLat},${finalLng}` +
        `&extra_computations=BUILDING_AND_ENTRANCES` +
        `&key=${API_KEY}`;

      const buildingRes = await fetch(buildingUrl);
      const buildingData = await buildingRes.json();

      // Extract building outline from response
      if (buildingData.results?.length) {
        for (const result of buildingData.results) {
          const buildings = result.buildings;
          if (buildings?.length) {
            const outline = buildings[0]?.building_outlines?.[0];
            if (outline?.display_polygon?.coordinates?.[0]) {
              // GeoJSON format: [[lng, lat], [lng, lat], ...]
              // Convert to Google Maps format: [{lat, lng}, ...]
              polygon = outline.display_polygon.coordinates[0].map(
                (coord: number[]) => ({
                  lat: coord[1],
                  lng: coord[0],
                })
              );
              break;
            }
          }
        }
      }
    } catch (e) {
      // Building outline not available — graceful fallback
      console.log("Building outline unavailable:", e);
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
