// NOAA weather surge pricing for the estimate engine.
//
// Checks active weather alerts at a property's location and returns
// a pricing multiplier. Post-storm demand drives roofing prices up
// 10-40% — this lets our estimates reflect real market conditions.
//
// API: https://api.weather.gov/alerts/active?point={lat},{lng}
// Free, no key needed. Rate limit: be reasonable (User-Agent required).
//
// Caching: results cached by rounded lat/lng (0.1° ≈ 7 mile radius)
// with a 1-hour TTL. Weather alerts don't change every minute.

// ---- TYPES ----

interface WeatherAlert {
  event: string;
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  certainty: "Observed" | "Likely" | "Possible" | "Unlikely" | "Unknown";
  urgency: "Immediate" | "Expected" | "Future" | "Past" | "Unknown";
  headline: string;
  description: string;
  expires: string;
}

export interface WeatherSurgeResult {
  multiplier: number;       // 1.0 = normal, 1.1+ = surged
  alerts: string[];         // human-readable alert summaries
  isSurged: boolean;        // convenience flag
  highestSeverity: string;  // "Extreme" | "Severe" | etc.
  fetchedAt: number;        // timestamp for cache freshness display
}

// ---- ALERT → MULTIPLIER MAPPING ----

// Maps NOAA alert event types to pricing surge multipliers.
// Multiple alerts stack (highest wins, not additive).
// Source: post-storm contractor pricing data (HomeAdvisor, RSMeans)
const EVENT_MULTIPLIERS: Record<string, number> = {
  // Hurricanes — massive demand surge, materials scarce
  "Hurricane Warning": 1.35,
  "Hurricane Watch": 1.20,
  "Hurricane Local Statement": 1.15,
  "Tropical Storm Warning": 1.25,
  "Tropical Storm Watch": 1.15,

  // Tornadoes — localized but intense damage
  "Tornado Warning": 1.25,
  "Tornado Watch": 1.10,

  // Severe storms — hail is the #1 roofing damage cause
  "Severe Thunderstorm Warning": 1.15,
  "Severe Thunderstorm Watch": 1.05,

  // Wind damage
  "Extreme Wind Warning": 1.25,
  "High Wind Warning": 1.10,
  "Wind Advisory": 1.05,

  // Flooding — causes secondary roof/structure damage
  "Flash Flood Warning": 1.10,
  "Flood Warning": 1.05,

  // Winter storms — ice dam damage
  "Ice Storm Warning": 1.15,
  "Winter Storm Warning": 1.10,
  "Blizzard Warning": 1.10,
};

// Severity-based fallback for alert types not in the map
const SEVERITY_FALLBACK: Record<string, number> = {
  Extreme: 1.20,
  Severe: 1.10,
  Moderate: 1.05,
  Minor: 1.0,
  Unknown: 1.0,
};

// ---- CACHE ----

interface CacheEntry {
  result: WeatherSurgeResult;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, CacheEntry>();

function cacheKey(lat: number, lng: number): string {
  // Round to 0.1° ≈ 7 mile radius — same alerts for nearby addresses
  return `${Math.round(lat * 10) / 10},${Math.round(lng * 10) / 10}`;
}

// ---- NOAA API ----

const NOAA_BASE = "https://api.weather.gov/alerts/active";
const USER_AGENT = "RuufPro/1.0 (admin@getruufpro.com)";

async function fetchAlerts(lat: number, lng: number): Promise<WeatherAlert[]> {
  const url = `${NOAA_BASE}?point=${lat.toFixed(4)},${lng.toFixed(4)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/geo+json",
    },
    // Short timeout — don't block the estimate if NOAA is slow
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    console.warn(`NOAA API ${res.status}: ${res.statusText} for ${lat},${lng}`);
    return [];
  }

  const data = await res.json();
  const features = data.features || [];

  return features.map((f: { properties: Record<string, string> }) => ({
    event: f.properties.event || "",
    severity: f.properties.severity || "Unknown",
    certainty: f.properties.certainty || "Unknown",
    urgency: f.properties.urgency || "Unknown",
    headline: f.properties.headline || "",
    description: f.properties.description || "",
    expires: f.properties.expires || "",
  }));
}

// ---- CORE LOGIC ----

function computeSurge(alerts: WeatherAlert[]): WeatherSurgeResult {
  if (alerts.length === 0) {
    return {
      multiplier: 1.0,
      alerts: [],
      isSurged: false,
      highestSeverity: "None",
      fetchedAt: Date.now(),
    };
  }

  // Find the highest multiplier from active alerts
  let maxMultiplier = 1.0;
  let highestSeverity = "Minor";
  const alertSummaries: string[] = [];

  const severityRank: Record<string, number> = {
    Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0,
  };

  for (const alert of alerts) {
    // Skip low-certainty alerts
    if (alert.certainty === "Unlikely") continue;

    // Get multiplier from event type, fall back to severity
    const eventMult = EVENT_MULTIPLIERS[alert.event];
    const sevMult = SEVERITY_FALLBACK[alert.severity] || 1.0;
    const mult = eventMult || sevMult;

    if (mult > maxMultiplier) {
      maxMultiplier = mult;
    }

    if ((severityRank[alert.severity] || 0) > (severityRank[highestSeverity] || 0)) {
      highestSeverity = alert.severity;
    }

    if (mult > 1.0) {
      alertSummaries.push(`${alert.event} (${alert.severity})`);
    }
  }

  return {
    multiplier: maxMultiplier,
    alerts: alertSummaries,
    isSurged: maxMultiplier > 1.0,
    highestSeverity,
    fetchedAt: Date.now(),
  };
}

// ---- PUBLIC API ----

/**
 * Get the weather surge multiplier for a property location.
 *
 * Returns 1.0 (no surge) if:
 * - No active weather alerts at this location
 * - NOAA API is unreachable (fails open — never blocks an estimate)
 * - No coordinates provided
 *
 * Results cached for 1 hour per ~7-mile radius.
 */
export async function getWeatherSurge(
  lat?: number,
  lng?: number
): Promise<WeatherSurgeResult> {
  // No coords = no surge (V1 manual input path)
  if (!lat || !lng) {
    return {
      multiplier: 1.0,
      alerts: [],
      isSurged: false,
      highestSeverity: "None",
      fetchedAt: Date.now(),
    };
  }

  // Check cache
  const key = cacheKey(lat, lng);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  // Fetch from NOAA (fail open on error)
  try {
    const alerts = await fetchAlerts(lat, lng);
    const result = computeSurge(alerts);

    // Cache the result
    cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });

    // Prune old cache entries (prevent memory leak on long-running server)
    if (cache.size > 500) {
      const now = Date.now();
      const keys = Array.from(cache.keys());
      for (const k of keys) {
        const v = cache.get(k);
        if (v && v.expiresAt < now) cache.delete(k);
      }
    }

    return result;
  } catch (err) {
    // NOAA down or timeout — fail open, don't block the estimate
    console.warn("Weather surge fetch failed (using 1.0):", err);
    return {
      multiplier: 1.0,
      alerts: [],
      isSurged: false,
      highestSeverity: "None",
      fetchedAt: Date.now(),
    };
  }
}
