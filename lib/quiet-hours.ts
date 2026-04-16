// Quiet hours enforcement — TCPA requires no automated texts before 8am
// or after 9pm in the recipient's local timezone.
//
// Phase 1 (current): Uses the contractor's state to determine timezone.
// This is close enough — leads are local to the contractor's service area.
//
// Phase 2 (post-launch): Derive recipient timezone from their phone area
// code or lead address for more accuracy.

// ---------------------------------------------------------------------------
// State → IANA timezone mapping
// Uses the most common timezone for each state. States that span multiple
// zones (e.g., Indiana, Texas) use the zone covering the majority.
// ---------------------------------------------------------------------------

const STATE_TIMEZONE: Record<string, string> = {
  // Eastern
  CT: "America/New_York", DE: "America/New_York", DC: "America/New_York",
  FL: "America/New_York", GA: "America/New_York", IN: "America/Indiana/Indianapolis",
  KY: "America/New_York", ME: "America/New_York", MD: "America/New_York",
  MA: "America/New_York", MI: "America/Detroit", NH: "America/New_York",
  NJ: "America/New_York", NY: "America/New_York", NC: "America/New_York",
  OH: "America/New_York", PA: "America/New_York", RI: "America/New_York",
  SC: "America/New_York", VT: "America/New_York", VA: "America/New_York",
  WV: "America/New_York",
  // Central
  AL: "America/Chicago", AR: "America/Chicago", IL: "America/Chicago",
  IA: "America/Chicago", KS: "America/Chicago", LA: "America/Chicago",
  MN: "America/Chicago", MS: "America/Chicago", MO: "America/Chicago",
  NE: "America/Chicago", ND: "America/Chicago", OK: "America/Chicago",
  SD: "America/Chicago", TN: "America/Chicago", TX: "America/Chicago",
  WI: "America/Chicago",
  // Mountain
  AZ: "America/Phoenix", CO: "America/Denver", ID: "America/Boise",
  MT: "America/Denver", NM: "America/Denver", UT: "America/Denver",
  WY: "America/Denver", NV: "America/Los_Angeles",
  // Pacific
  CA: "America/Los_Angeles", OR: "America/Los_Angeles",
  WA: "America/Los_Angeles",
  // Non-contiguous
  AK: "America/Anchorage", HI: "Pacific/Honolulu",
  // Territories
  PR: "America/Puerto_Rico", GU: "Pacific/Guam", VI: "America/Virgin",
  AS: "Pacific/Pago_Pago", MP: "Pacific/Guam",
};

// Quiet hours window: no texts before 8:00 AM or at/after 9:00 PM (21:00)
const QUIET_START_HOUR = 21; // 9:00 PM — stop sending
const QUIET_END_HOUR = 8;    // 8:00 AM — resume sending

/**
 * Get the IANA timezone for a US state abbreviation.
 * Falls back to Eastern if state is unknown (conservative — Eastern is
 * the earliest US timezone, so quiet hours start soonest).
 */
export function getTimezoneForState(state: string): string {
  return STATE_TIMEZONE[state?.toUpperCase()] || "America/New_York";
}

/**
 * Check if the current time falls within quiet hours for a given state.
 * Returns true if it's before 8am or at/after 9pm in the state's timezone.
 */
export function isQuietHours(contractorState: string): boolean {
  const tz = getTimezoneForState(contractorState);
  const now = new Date();

  // Get the current hour in the contractor's timezone
  const localHour = parseInt(
    now.toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false })
  );

  return localHour < QUIET_END_HOUR || localHour >= QUIET_START_HOUR;
}

/**
 * Calculate when the next send window opens (8:00 AM in the contractor's timezone).
 * Returns a UTC Date that can be used with Inngest step.sleepUntil().
 *
 * If it's currently before 8am, returns 8am today.
 * If it's at or after 9pm, returns 8am tomorrow.
 */
export function nextSendWindow(contractorState: string): Date {
  const tz = getTimezoneForState(contractorState);
  const now = new Date();

  // Get current date parts in the contractor's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === "year")!.value);
  const month = parseInt(parts.find(p => p.type === "month")!.value);
  const day = parseInt(parts.find(p => p.type === "day")!.value);
  const hour = parseInt(parts.find(p => p.type === "hour")!.value);

  // Build the target 8:00 AM date string in the contractor's timezone
  let targetDay = day;
  if (hour >= QUIET_START_HOUR) {
    // It's after 9pm — next window is tomorrow at 8am
    targetDay = day + 1;
  }
  // If hour < 8, target is today at 8am (targetDay unchanged)

  // Create a date string in the target timezone and convert to UTC
  // Format: "YYYY-MM-DD HH:MM" interpreted in the contractor's tz
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(targetDay).padStart(2, "0");
  const dateStr = `${year}-${paddedMonth}-${paddedDay}T08:00:00`;

  // Use a temporary Date to find the UTC offset for this timezone at 8am
  // We create the date and adjust for timezone offset
  const tempDate = new Date(dateStr + "Z"); // Start as UTC
  const utcStr = tempDate.toLocaleString("en-US", { timeZone: "UTC", hour: "numeric", hour12: false });
  const localStr = tempDate.toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false });
  const offsetHours = parseInt(localStr) - parseInt(utcStr);

  // Subtract the offset to convert local 8am to UTC
  const result = new Date(tempDate.getTime() - offsetHours * 60 * 60 * 1000);

  // Safety: if the calculated time is in the past (edge case around midnight),
  // push to tomorrow
  if (result.getTime() <= now.getTime()) {
    result.setTime(result.getTime() + 24 * 60 * 60 * 1000);
  }

  return result;
}
