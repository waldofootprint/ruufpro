// Florida DBPR License Lookup — verifies roofing contractor licenses.
// Uses the FL DBPR public search (no API key needed, free).
// Returns license type (residential/commercial/both) and license number.
// Best-effort: failures don't block pipeline. $0 cost.

const DBPR_SEARCH_URL = "https://www.myfloridalicense.com/wl11.asp";

export interface FLLicenseResult {
  found: boolean;
  license_type: string | null; // "Certified Roofing Contractor", "Registered Roofing Contractor", etc.
  license_number: string | null;
  status: string | null; // "Current", "Delinquent", etc.
  error?: string;
}

// The DBPR doesn't have a clean JSON API, so we scrape the search results page.
// Search by business name in the roofing contractor category.
export async function lookupFLLicense(businessName: string): Promise<FLLicenseResult> {
  try {
    // DBPR uses a form-based search. We POST to the search endpoint.
    // License types for roofing: CCC (Certified), RC (Registered)
    const searchParams = new URLSearchParams({
      SID: "",
      A: "1",     // Search type: by name
      LicName: businessName,
      LicNum: "",
      County: "",
      BoardCD: "7500", // 7500 = Roofing contractors
      AddlQual: "",
      City: "",
      Status: "CUR",  // Current licenses only
    });

    const res = await fetch(DBPR_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: searchParams.toString(),
    });

    if (!res.ok) {
      return { found: false, license_type: null, license_number: null, status: null, error: `HTTP ${res.status}` };
    }

    const html = await res.text();

    // Parse the results table. The DBPR returns HTML with a table of matches.
    // Look for license number pattern: CCC followed by digits, or RC followed by digits
    const licenseMatch = html.match(/(CCC\d{6,7}|RC\d{6,7})/);
    if (!licenseMatch) {
      return { found: false, license_type: null, license_number: null, status: null };
    }

    const licenseNumber = licenseMatch[1];

    // Determine type from prefix
    let licenseType = "Roofing Contractor";
    if (licenseNumber.startsWith("CCC")) {
      licenseType = "Certified Roofing Contractor";
    } else if (licenseNumber.startsWith("RC")) {
      licenseType = "Registered Roofing Contractor";
    }

    // Check if "Current" appears near the license number
    const statusMatch = html.match(/Current|Delinquent|Null &amp; Void|Suspended/i);
    const status = statusMatch ? statusMatch[0] : "Unknown";

    return {
      found: true,
      license_type: licenseType,
      license_number: licenseNumber,
      status,
    };
  } catch (err: any) {
    return {
      found: false,
      license_type: null,
      license_number: null,
      status: null,
      error: err.message,
    };
  }
}
