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

export function usePlacesAutocomplete() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!key) return;

    ensureConfigured();
    importLibrary("places")
      .then(() => {
        serviceRef.current = new google.maps.places.AutocompleteService();
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        setIsLoaded(true);
      })
      .catch(() => {
        // Silently fail — widget still works with manual address entry
      });
  }, []);

  const search = useCallback(
    (input: string) => {
      if (!serviceRef.current || !input || input.length < 3) {
        setSuggestions([]);
        return;
      }

      serviceRef.current.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: "us" },
          types: ["address"],
          sessionToken: sessionTokenRef.current!,
        },
        (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setSuggestions(
              predictions.slice(0, 5).map((p) => ({
                placeId: p.place_id,
                description: p.description,
              }))
            );
          } else {
            setSuggestions([]);
          }
        }
      );
    },
    []
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    // New session token after selection (saves money — one session = one billing event)
    if (isLoaded) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
  }, [isLoaded]);

  return { suggestions, search, clearSuggestions, isLoaded };
}
