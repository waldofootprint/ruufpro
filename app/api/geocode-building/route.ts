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

        // Extract building outline — pick the LARGEST building (skip sheds/outbuildings)
        const buildings = result.buildings;
        if (buildings?.length) {
          let bestPolygon: number[][] | null = null;
          let bestArea = 0;

          for (const bldg of buildings) {
            for (const outline of bldg.building_outlines || []) {
              const coords = outline?.display_polygon?.coordinates?.[0];
              if (!coords || coords.length < 4) continue;

              // Calculate approximate area using shoelace formula
              let area = 0;
              for (let i = 0; i < coords.length - 1; i++) {
                area += coords[i][0] * coords[i + 1][1];
                area -= coords[i + 1][0] * coords[i][1];
              }
              area = Math.abs(area) / 2;

              if (area > bestArea) {
                bestArea = area;
                bestPolygon = coords;
              }
            }
          }

          // Only use the outline if it's reasonably sized (skip tiny sheds)
          // ~500 sqft minimum in geo-units ≈ 4e-9 in lng*lat units
          if (bestPolygon && bestArea > 2e-9) {
            polygon = bestPolygon.map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }));
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
