// Google Places Autocomplete hook — uses the new AutocompleteSuggestion API
// (AutocompleteService was deprecated for new customers March 2025)

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let configured = false;

function ensureConfigured() {
  if (!configured) {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    });
    configured = true;
  }
}

interface Suggestion {
  placeId: string;
  description: string;
}

interface PlaceCoords {
  lat: number;
  lng: number;
  postalCode?: string | null;
}

export function usePlacesAutocomplete() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return;

    ensureConfigured();
    importLibrary("places")
      .then(() => {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        setIsLoaded(true);
      })
      .catch(() => {
        // Silently fail — widget still works with manual address entry
      });
  }, []);

  const search = useCallback(
    async (input: string) => {
      if (!isLoaded || !input || input.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        const request = {
          input,
          sessionToken: sessionTokenRef.current!,
          includedPrimaryTypes: ["street_address", "subpremise", "premise"],
          includedRegionCodes: ["us"],
        };

        const { suggestions: results } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

        setSuggestions(
          results
            .filter((s) => s.placePrediction)
            .slice(0, 5)
            .map((s) => ({
              placeId: s.placePrediction!.placeId,
              description: s.placePrediction!.text.text,
            }))
        );
      } catch {
        setSuggestions([]);
      }
    },
    [isLoaded]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    // New session token after selection (saves money — one session = one billing event)
    if (isLoaded) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, [isLoaded]);

  // Get lat/lng from a placeId via Place.fetchFields (new API)
  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<PlaceCoords | null> => {
      if (!isLoaded) return null;

      try {
        const place = new google.maps.places.Place({ id: placeId });
        await place.fetchFields({ fields: ["location", "addressComponents"] });

        // Rotate session token — fetchFields completes the session
        sessionTokenRef.current =
          new google.maps.places.AutocompleteSessionToken();

        if (place.location) {
          const postalComponent = place.addressComponents?.find((c) =>
            c.types?.includes("postal_code")
          );
          return {
            lat: place.location.lat(),
            lng: place.location.lng(),
            postalCode: postalComponent?.shortText || postalComponent?.longText || null,
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    [isLoaded]
  );

  return { suggestions, search, clearSuggestions, isLoaded, getPlaceDetails };
}
