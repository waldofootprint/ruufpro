// Metro-level pricing using BLS roofer wage data.
//
// Replaces 5 broad regional buckets with 48+ metro-specific rates.
// Uses Bureau of Labor Statistics OEWS data (SOC 47-2181: Roofers)
// to compute a labor cost multiplier per metro area.
//
// How it works:
// 1. Look up the metro area from city/state or ZIP code
// 2. Get the BLS roofer hourly mean wage for that metro
// 3. Compute a multiplier vs national average (weighted by labor share)
// 4. Apply multiplier to national base rates → metro-specific $/sqft
//
// Data source: BLS OEWS May 2024 release (updates annually)
// API: https://api.bls.gov/publicAPI/v2/timeseries/data/
// Series format: OEUM + 7-digit CBSA + 000000 + 472181 + 03

import type { RegionalRates } from "./regional-pricing";

// ---- CONSTANTS ----

// National baseline rates per material ($/sqft, ALL-IN installed price
// before size/shape multiplier). US weighted averages 2025-2026.
//
// PRICING.1 recalibration (2026-04-23): raised from materials+labor-only
// ($3.50-$9.00) to all-in-installed ($6.25-$15.50). Back-calibrated from
// D.5 bench where Roofle implied $6.46-$8.26/sqft FL asphalt. Final $/sqft
// = NATIONAL_BASE_RATE × metro_wage_multiplier × size_shape_multiplier.
// For Jacksonville (wage 22.42): $6.25 × 0.890 × 1.30 = ~$7.23/sqft on a
// medium-complex roof — matches Roofle's observed $7.23-$7.69 envelope.
const NATIONAL_BASE_RATES = {
  asphalt: 6.25,
  metal: 13.00,
  tile: 15.50,
  flat: 7.00,
};

// BLS national average roofer hourly mean wage (May 2024)
const NATIONAL_ROOFER_WAGE = 27.45;

// Labor is ~60% of total installed roofing cost.
// Materials don't vary much by metro, but labor does.
const LABOR_SHARE = 0.60;

// Metro-specific band: tighter than regional (±8% vs ±10%) because
// the rate is more precise when we know the exact metro.
const METRO_BAND_FRACTION = 0.08;

// ---- BLS WAGE DATA ----

interface MetroWage {
  name: string;
  wage: number; // BLS hourly mean, May 2024
}

// BLS OEWS roofer hourly mean wages by CBSA code (May 2024 release).
// 48 metros with published data + 12 Florida metros for detailed coverage.
const METRO_WAGES: Record<string, MetroWage> = {
  // --- FLORIDA (primary market — most granular) ---
  "45300": { name: "Tampa-St Petersburg-Clearwater", wage: 23.24 },
  "33100": { name: "Miami-Fort Lauderdale-Pompano Beach", wage: 23.47 },
  "36740": { name: "Orlando-Kissimmee-Sanford", wage: 22.80 },
  "27260": { name: "Jacksonville", wage: 22.42 },
  "34580": { name: "Naples-Marco Island", wage: 30.41 },
  "17820": { name: "Pensacola-Ferry Pass-Brent", wage: 26.26 },
  "19660": { name: "Deltona-Daytona Beach-Ormond Beach", wage: 21.37 },
  "37460": { name: "Palm Bay-Melbourne-Titusville", wage: 21.33 },
  "37340": { name: "Palm Coast-Flagler Beach", wage: 21.84 },
  "45220": { name: "Tallahassee", wage: 21.17 },
  "23540": { name: "Gainesville", wage: 21.88 },

  // --- MAJOR US METROS ---
  "35620": { name: "New York-Newark-Jersey City", wage: 37.24 },
  "31080": { name: "Los Angeles-Long Beach-Anaheim", wage: 32.43 },
  "16980": { name: "Chicago-Naperville-Elgin", wage: 35.15 },
  "19100": { name: "Dallas-Fort Worth-Arlington", wage: 23.41 },
  "26420": { name: "Houston-The Woodlands-Sugar Land", wage: 22.43 },
  "47900": { name: "Washington-Arlington-Alexandria", wage: 28.52 },
  "37980": { name: "Philadelphia-Camden-Wilmington", wage: 29.42 },
  "12060": { name: "Atlanta-Sandy Springs-Alpharetta", wage: 23.36 },
  "14460": { name: "Boston-Cambridge-Newton", wage: 33.41 },
  "38060": { name: "Phoenix-Mesa-Chandler", wage: 25.74 },
  "41860": { name: "San Francisco-Oakland-Berkeley", wage: 36.28 },
  "40140": { name: "Riverside-San Bernardino-Ontario", wage: 30.75 },
  "19820": { name: "Detroit-Warren-Dearborn", wage: 30.39 },
  "42660": { name: "Seattle-Tacoma-Bellevue", wage: 34.37 },
  "33460": { name: "Minneapolis-St Paul-Bloomington", wage: 36.36 },
  "41740": { name: "San Diego-Chula Vista-Carlsbad", wage: 32.13 },
  "19740": { name: "Denver-Aurora-Lakewood", wage: 27.94 },
  "41180": { name: "St. Louis", wage: 31.02 },
  "12580": { name: "Baltimore-Columbia-Towson", wage: 28.91 },
  "16740": { name: "Charlotte-Concord-Gastonia", wage: 24.53 },
  "38900": { name: "Portland-Vancouver-Hillsboro", wage: 30.43 },
  "40900": { name: "Sacramento-Roseville-Folsom", wage: 31.99 },
  "38300": { name: "Pittsburgh", wage: 25.62 },
  "29820": { name: "Las Vegas-Henderson-Paradise", wage: 26.43 },
  "12420": { name: "Austin-Round Rock-Georgetown", wage: 23.46 },
  "17140": { name: "Cincinnati", wage: 27.47 },
  "28140": { name: "Kansas City", wage: 29.17 },
  "18140": { name: "Columbus", wage: 28.35 },
  "26900": { name: "Indianapolis-Carmel-Anderson", wage: 27.03 },
  "41940": { name: "San Jose-Sunnyvale-Santa Clara", wage: 37.66 },
  "34980": { name: "Nashville-Davidson-Murfreesboro", wage: 24.08 },
  "47260": { name: "Virginia Beach-Norfolk-Newport News", wage: 23.62 },
  "39300": { name: "Providence-Warwick", wage: 29.44 },
  "33340": { name: "Milwaukee-Waukesha", wage: 27.22 },
  "36420": { name: "Oklahoma City", wage: 22.55 },
  "39580": { name: "Raleigh-Cary", wage: 24.55 },
  "32820": { name: "Memphis", wage: 22.72 },
  "40060": { name: "Richmond", wage: 23.64 },
  "31140": { name: "Louisville/Jefferson County", wage: 25.49 },
  "35380": { name: "New Orleans-Metairie", wage: 23.51 },
  "41620": { name: "Salt Lake City", wage: 26.53 },
  "25540": { name: "Hartford-East Hartford-Middletown", wage: 33.14 },
  "15380": { name: "Buffalo-Cheektowaga", wage: 31.05 },
  "13820": { name: "Birmingham-Hoover", wage: 23.21 },
};

// ---- CITY → CBSA LOOKUP ----

// Normalized city name → CBSA code. Covers major cities + Florida detail.
// City names are lowercase, trimmed. Common variants included.
const CITY_TO_CBSA: Record<string, string> = {
  // Florida (detailed)
  "tampa": "45300", "st petersburg": "45300", "saint petersburg": "45300",
  "clearwater": "45300", "brandon": "45300", "riverview": "45300",
  "plant city": "45300", "lakeland": "45300", "winter haven": "45300",
  "miami": "33100", "fort lauderdale": "33100", "pompano beach": "33100",
  "hollywood": "33100", "coral springs": "33100", "pembroke pines": "33100",
  "hialeah": "33100", "miramar": "33100", "davie": "33100",
  "boca raton": "33100", "deerfield beach": "33100", "sunrise": "33100",
  "plantation": "33100", "weston": "33100", "coconut creek": "33100",
  "west palm beach": "33100", "boynton beach": "33100", "delray beach": "33100",
  "jupiter": "33100", "palm beach gardens": "33100", "wellington": "33100",
  "royal palm beach": "33100", "lake worth": "33100",
  "orlando": "36740", "kissimmee": "36740", "sanford": "36740",
  "altamonte springs": "36740", "apopka": "36740", "ocoee": "36740",
  "winter park": "36740", "winter garden": "36740", "clermont": "36740",
  "jacksonville": "27260", "st augustine": "27260", "saint augustine": "27260",
  "orange park": "27260", "fleming island": "27260",
  "naples": "34580", "marco island": "34580", "bonita springs": "34580",
  "estero": "34580",
  "fort myers": "34580", "cape coral": "34580", "lehigh acres": "34580",
  "pensacola": "17820", "navarre": "17820", "milton": "17820",
  "crestview": "17820", "destin": "17820", "fort walton beach": "17820",
  "daytona beach": "19660", "ormond beach": "19660", "port orange": "19660",
  "new smyrna beach": "19660", "deltona": "19660", "deland": "19660",
  "melbourne": "37460", "palm bay": "37460", "titusville": "37460",
  "cocoa": "37460", "rockledge": "37460", "viera": "37460",
  "palm coast": "37340", "flagler beach": "37340", "bunnell": "37340",
  "tallahassee": "45220",
  "gainesville": "23540", "ocala": "23540",
  "sarasota": "45300", "bradenton": "45300", "venice": "45300",
  "port charlotte": "45300", "punta gorda": "45300", "north port": "45300",
  "port st lucie": "33100", "stuart": "33100", "fort pierce": "33100",
  "vero beach": "33100", "sebastian": "33100",

  // Major US cities
  "new york": "35620", "brooklyn": "35620", "queens": "35620",
  "bronx": "35620", "manhattan": "35620", "staten island": "35620",
  "newark": "35620", "jersey city": "35620", "yonkers": "35620",
  "los angeles": "31080", "long beach": "31080", "anaheim": "31080",
  "santa ana": "31080", "irvine": "31080", "glendale": "31080",
  "pasadena": "31080", "torrance": "31080", "pomona": "31080",
  "chicago": "16980", "naperville": "16980", "aurora": "16980",
  "joliet": "16980", "elgin": "16980",
  "dallas": "19100", "fort worth": "19100", "arlington": "19100",
  "plano": "19100", "irving": "19100", "frisco": "19100",
  "mckinney": "19100", "denton": "19100", "garland": "19100",
  "houston": "26420", "sugar land": "26420",
  "pearland": "26420", "league city": "26420", "katy": "26420",
  "washington": "47900", "alexandria": "47900",
  "bethesda": "47900", "silver spring": "47900", "rockville": "47900",
  "philadelphia": "37980", "camden": "37980", "wilmington": "37980",
  "atlanta": "12060", "marietta": "12060", "roswell": "12060",
  "alpharetta": "12060", "sandy springs": "12060", "kennesaw": "12060",
  "boston": "14460", "cambridge": "14460", "quincy": "14460",
  "newton": "14460", "brockton": "14460",
  "phoenix": "38060", "mesa": "38060", "scottsdale": "38060",
  "chandler": "38060", "tempe": "38060", "gilbert": "38060",
  "peoria": "38060", "surprise": "38060",
  "san francisco": "41860", "oakland": "41860", "berkeley": "41860",
  "fremont": "41860", "hayward": "41860",
  "riverside": "40140", "san bernardino": "40140", "ontario": "40140",
  "fontana": "40140", "moreno valley": "40140", "rancho cucamonga": "40140",
  "detroit": "19820", "warren": "19820", "dearborn": "19820",
  "livonia": "19820", "sterling heights": "19820", "ann arbor": "19820",
  "seattle": "42660", "tacoma": "42660", "bellevue": "42660",
  "kent": "42660", "renton": "42660", "everett": "42660",
  "minneapolis": "33460", "st paul": "33460", "saint paul": "33460",
  "bloomington": "33460", "plymouth": "33460",
  "san diego": "41740", "chula vista": "41740", "carlsbad": "41740",
  "escondido": "41740", "oceanside": "41740",
  "denver": "19740", "lakewood": "19740",
  "thornton": "19740", "westminster": "19740", "arvada": "19740",
  "colorado springs": "19740",
  "st louis": "41180", "saint louis": "41180",
  "baltimore": "12580", "towson": "12580", "columbia": "12580",
  "charlotte": "16740", "concord": "16740", "gastonia": "16740",
  "rock hill": "16740",
  "portland": "38900", "vancouver": "38900", "hillsboro": "38900",
  "beaverton": "38900", "gresham": "38900",
  "sacramento": "40900", "roseville": "40900", "elk grove": "40900",
  "folsom": "40900",
  "pittsburgh": "38300",
  "las vegas": "29820", "henderson": "29820", "north las vegas": "29820",
  "austin": "12420", "round rock": "12420", "cedar park": "12420",
  "georgetown": "12420",
  "san antonio": "19100", // No BLS data — use Dallas rate as TX fallback
  "cincinnati": "17140",
  "kansas city": "28140",
  "columbus": "18140",
  "indianapolis": "26900", "carmel": "26900", "fishers": "26900",
  "san jose": "41940", "sunnyvale": "41940", "santa clara": "41940",
  "cupertino": "41940", "milpitas": "41940",
  "nashville": "34980", "murfreesboro": "34980", "franklin": "34980",
  "virginia beach": "47260", "norfolk": "47260", "newport news": "47260",
  "hampton": "47260", "chesapeake": "47260",
  "providence": "39300", "warwick": "39300", "cranston": "39300",
  "milwaukee": "33340", "waukesha": "33340",
  "oklahoma city": "36420", "norman": "36420", "edmond": "36420",
  "raleigh": "39580", "cary": "39580", "durham": "39580",
  "chapel hill": "39580",
  "memphis": "32820",
  "richmond": "40060", "henrico": "40060",
  "louisville": "31140",
  "new orleans": "35380", "metairie": "35380", "kenner": "35380",
  "salt lake city": "41620", "west jordan": "41620", "sandy": "41620",
  "west valley city": "41620", "provo": "41620",
  "hartford": "25540", "new haven": "25540",
  "buffalo": "15380",
  "birmingham": "13820", "hoover": "13820",
  "tucson": "38060", // Use Phoenix rate for AZ
};

// ---- ZIP3 → CBSA LOOKUP ----

// First 3 digits of ZIP code → CBSA code.
// Florida has the most detailed coverage.
const ZIP3_TO_CBSA: Record<string, string> = {
  // Florida (detailed — primary market)
  "320": "27260", // Jacksonville
  "321": "19660", // Daytona Beach area
  "322": "27260", // Jacksonville suburbs
  "323": "45220", // Tallahassee
  "324": "17820", // Panama City → Pensacola rate
  "325": "17820", // Pensacola
  "326": "23540", // Gainesville
  "327": "36740", // Orlando
  "328": "36740", // Orlando south (Kissimmee)
  "329": "37460", // Melbourne / Palm Bay
  "330": "33100", // Miami south
  "331": "33100", // Miami
  "332": "33100", // Miami Beach
  "333": "33100", // Fort Lauderdale
  "334": "33100", // West Palm Beach
  "335": "45300", // Tampa
  "336": "45300", // Tampa / Plant City
  "337": "45300", // St Petersburg
  "338": "45300", // Lakeland → Tampa rate
  "339": "34580", // Fort Myers / Cape Coral → Naples rate
  "341": "34580", // Naples
  "342": "45300", // Sarasota / Bradenton → Tampa rate
  "344": "23540", // Gainesville / Leesburg
  "346": "45300", // Tampa / Brandon
  "347": "36740", // Orlando north (Sanford)
  "349": "33100", // Fort Pierce / Stuart → Miami rate

  // Texas
  "750": "19100", "751": "19100", "752": "19100", "753": "19100", // Dallas
  "754": "19100", "755": "19100", "760": "19100", "761": "19100",
  "770": "26420", "771": "26420", "772": "26420", "773": "26420", // Houston
  "774": "26420", "775": "26420",
  "786": "12420", "787": "12420", "788": "12420", // Austin
  "780": "19100", "781": "19100", "782": "19100", // San Antonio → Dallas rate

  // Northeast
  "100": "35620", "101": "35620", "102": "35620", "103": "35620", // NYC
  "104": "35620", "105": "35620", "106": "35620", "107": "35620",
  "108": "35620", "109": "35620", "110": "35620", "111": "35620",
  "112": "35620", "113": "35620", "114": "35620", "116": "35620",
  "070": "35620", "071": "35620", "072": "35620", "073": "35620", // NJ (NYC metro)
  "190": "37980", "191": "37980", "192": "37980", "193": "37980", // Philadelphia
  "010": "14460", "011": "14460", "012": "14460", "013": "14460", // Boston area
  "014": "14460", "015": "14460", "016": "14460", "017": "14460",
  "018": "14460", "019": "14460", "020": "14460", "021": "14460",
  "022": "14460", "023": "14460", "024": "14460",
  "060": "25540", "061": "25540", "062": "25540", // Hartford
  "028": "39300", "029": "39300", // Providence
  "140": "15380", "141": "15380", "142": "15380", "143": "15380", // Buffalo

  // Southeast
  "300": "12060", "301": "12060", "302": "12060", "303": "12060", // Atlanta
  "304": "12060", "305": "12060", "306": "12060", "311": "12060",
  "280": "16740", "281": "16740", "282": "16740", // Charlotte
  "275": "39580", "276": "39580", "277": "39580", // Raleigh
  "370": "34980", "371": "34980", "372": "34980", // Nashville
  "350": "13820", "351": "13820", "352": "13820", // Birmingham
  "380": "32820", "381": "32820", "382": "32820", // Memphis
  "700": "35380", "701": "35380", // New Orleans
  "230": "40060", "231": "40060", "232": "40060", // Richmond
  "233": "47260", "234": "47260", "235": "47260", "236": "47260", // Virginia Beach

  // Midwest
  "600": "16980", "601": "16980", "602": "16980", "603": "16980", // Chicago
  "604": "16980", "605": "16980", "606": "16980", "607": "16980",
  "480": "19820", "481": "19820", "482": "19820", "483": "19820", // Detroit
  "484": "19820", "485": "19820",
  "550": "33460", "551": "33460", "553": "33460", "554": "33460", // Minneapolis
  "555": "33460", "556": "33460",
  "430": "18140", "431": "18140", "432": "18140", // Columbus
  "450": "17140", "451": "17140", "452": "17140", // Cincinnati
  "460": "26900", "461": "26900", "462": "26900", // Indianapolis
  "640": "28140", "641": "28140", "660": "28140", "661": "28140", // Kansas City
  "530": "33340", "531": "33340", "532": "33340", // Milwaukee
  "630": "41180", "631": "41180", "632": "41180", // St. Louis
  "400": "31140", "401": "31140", "402": "31140", // Louisville

  // West
  "900": "31080", "901": "31080", "902": "31080", "903": "31080", // LA
  "904": "31080", "905": "31080", "906": "31080", "907": "31080",
  "908": "31080", "910": "31080", "911": "31080", "912": "31080",
  "913": "31080", "914": "31080", "915": "31080", "916": "31080",
  "917": "31080", "918": "31080",
  "919": "41740", "920": "41740", "921": "41740", "922": "41740", // San Diego
  "925": "40140", "926": "40140", "927": "40140", // Riverside
  "940": "41860", "941": "41860", "943": "41860", "944": "41860", // SF
  "945": "41860", "946": "41860", "947": "41860", "948": "41860", "949": "41860",
  "950": "41940", "951": "41940", "952": "41940", "953": "41940", // San Jose
  "954": "41940", "955": "41940",
  "956": "40900", "957": "40900", "958": "40900", "959": "40900", // Sacramento
  "980": "42660", "981": "42660", "982": "42660", "983": "42660", // Seattle
  "984": "42660",
  "970": "38900", "971": "38900", "972": "38900", "973": "38900", // Portland
  "800": "19740", "801": "19740", "802": "19740", "803": "19740", // Denver
  "804": "19740", "805": "19740",
  "889": "29820", "890": "29820", "891": "29820", // Las Vegas
  "840": "41620", "841": "41620", // Salt Lake City
  "850": "38060", "851": "38060", "852": "38060", "853": "38060", // Phoenix

  // Southwest
  "730": "36420", "731": "36420", // Oklahoma City

  // DC / Baltimore
  "200": "47900", "201": "47900", "202": "47900", "203": "47900", // DC
  "204": "47900", "205": "47900", "206": "47900", "207": "47900",
  "208": "47900", "209": "47900", "220": "47900", "221": "47900",
  "222": "47900",
  "210": "12580", "211": "12580", "212": "12580", // Baltimore
};

// State → largest metro CBSA (fallback when no city or ZIP available)
const STATE_DEFAULT_METRO: Record<string, string> = {
  FL: "45300", // Tampa (closest to FL average wage)
  TX: "19100", // Dallas
  CA: "31080", // Los Angeles
  NY: "35620", // New York
  IL: "16980", // Chicago
  PA: "37980", // Philadelphia
  OH: "18140", // Columbus
  GA: "12060", // Atlanta
  NC: "16740", // Charlotte
  MI: "19820", // Detroit
  NJ: "35620", // NYC metro
  VA: "47260", // Virginia Beach
  WA: "42660", // Seattle
  AZ: "38060", // Phoenix
  MA: "14460", // Boston
  TN: "34980", // Nashville
  IN: "26900", // Indianapolis
  MO: "28140", // Kansas City
  MD: "12580", // Baltimore
  WI: "33340", // Milwaukee
  CO: "19740", // Denver
  MN: "33460", // Minneapolis
  SC: "16740", // Charlotte metro extends into SC
  AL: "13820", // Birmingham
  LA: "35380", // New Orleans
  KY: "31140", // Louisville
  OR: "38900", // Portland
  OK: "36420", // Oklahoma City
  CT: "25540", // Hartford
  UT: "41620", // Salt Lake City
  NV: "29820", // Las Vegas
  MS: "32820", // Memphis metro extends into MS
  AR: "32820", // Memphis metro
  KS: "28140", // Kansas City metro
  NE: "28140", // Kansas City-ish
  RI: "39300", // Providence
  DC: "47900", // Washington
  DE: "37980", // Philadelphia metro
};

// ---- CORE LOGIC ----

/**
 * Compute a cost-of-living multiplier from BLS roofer wage data.
 * Materials (40%) don't vary much by metro. Labor (60%) scales with local wages.
 */
function getMultiplier(wage: number): number {
  return (1 - LABOR_SHARE) + LABOR_SHARE * (wage / NATIONAL_ROOFER_WAGE);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Find the CBSA code for a given city + state, or ZIP code.
 * Returns undefined if no metro match found.
 */
function findCbsa(state?: string, city?: string, zip?: string): string | undefined {
  // 1. Try city lookup first (most precise when available)
  if (city) {
    const normalized = city.toLowerCase().trim();
    const cbsa = CITY_TO_CBSA[normalized];
    if (cbsa && METRO_WAGES[cbsa]) return cbsa;
  }

  // 2. Try ZIP3 prefix
  if (zip && zip.length >= 3) {
    const zip3 = zip.replace(/\s/g, "").substring(0, 3);
    const cbsa = ZIP3_TO_CBSA[zip3];
    if (cbsa && METRO_WAGES[cbsa]) return cbsa;
  }

  // 3. Fall back to state's default metro
  if (state) {
    const cbsa = STATE_DEFAULT_METRO[state.toUpperCase()];
    if (cbsa && METRO_WAGES[cbsa]) return cbsa;
  }

  return undefined;
}

/**
 * Get metro-adjusted pricing defaults.
 *
 * Pass as much location info as available — the function uses the most
 * precise match: city > ZIP > state > regional fallback.
 *
 * Returns rates with a tighter ±8% band (vs ±10% regional) because
 * metro-specific data reduces geographic uncertainty.
 */
export function getMetroDefaults(
  state: string,
  city?: string,
  zip?: string
): { rates: RegionalRates; metroName: string | null; isMetroAdjusted: boolean } {
  const cbsa = findCbsa(state, city, zip);

  if (!cbsa) {
    // No metro match — caller should fall back to getRegionalDefaults()
    return { rates: fallbackRates(state), metroName: null, isMetroAdjusted: false };
  }

  const metro = METRO_WAGES[cbsa];
  const mult = getMultiplier(metro.wage);

  const rates: RegionalRates = {
    asphalt_low: round2(NATIONAL_BASE_RATES.asphalt * mult * (1 - METRO_BAND_FRACTION)),
    asphalt_high: round2(NATIONAL_BASE_RATES.asphalt * mult * (1 + METRO_BAND_FRACTION)),
    metal_low: round2(NATIONAL_BASE_RATES.metal * mult * (1 - METRO_BAND_FRACTION)),
    metal_high: round2(NATIONAL_BASE_RATES.metal * mult * (1 + METRO_BAND_FRACTION)),
    tile_low: round2(NATIONAL_BASE_RATES.tile * mult * (1 - METRO_BAND_FRACTION)),
    tile_high: round2(NATIONAL_BASE_RATES.tile * mult * (1 + METRO_BAND_FRACTION)),
    flat_low: round2(NATIONAL_BASE_RATES.flat * mult * (1 - METRO_BAND_FRACTION)),
    flat_high: round2(NATIONAL_BASE_RATES.flat * mult * (1 + METRO_BAND_FRACTION)),
  };

  return { rates, metroName: metro.name, isMetroAdjusted: true };
}

/**
 * Get the metro name for display (e.g. "Tampa-St Petersburg-Clearwater").
 * Returns null if no metro match.
 */
export function getMetroName(state: string, city?: string, zip?: string): string | null {
  const cbsa = findCbsa(state, city, zip);
  if (!cbsa) return null;
  return METRO_WAGES[cbsa]?.name || null;
}

// Minimal fallback using the same regional structure (imported at runtime to avoid circular deps)
function fallbackRates(state: string): RegionalRates {
  // Inline the regional mapping to avoid circular import with regional-pricing.ts
  const REGION_MAP: Record<string, string> = {
    AL: "se", FL: "se", GA: "se", SC: "se", NC: "se", TN: "se",
    MS: "se", LA: "se", AR: "se", VA: "se",
    TX: "sw", OK: "sw", NM: "sw", AZ: "sw",
    CA: "w", OR: "w", WA: "w", NV: "w", CO: "w", UT: "w",
    ID: "w", MT: "w", WY: "w", HI: "w", AK: "w",
    NY: "ne", NJ: "ne", PA: "ne", CT: "ne", MA: "ne", RI: "ne",
    NH: "ne", VT: "ne", ME: "ne", MD: "ne", DE: "ne", DC: "ne", WV: "ne",
    OH: "mw", MI: "mw", IN: "mw", IL: "mw", WI: "mw", MN: "mw",
    IA: "mw", MO: "mw", KS: "mw", NE: "mw", SD: "mw", ND: "mw", KY: "mw",
  };
  // PRICING.1 (2026-04-23): fallbacks recalibrated to all-in installed price
  // (1.85× prior materials+labor values) to match the new regional-pricing.ts
  // baseline + size/shape multiplier in calculateEstimate.
  const FALLBACKS: Record<string, RegionalRates> = {
    se: { asphalt_low: 5.00, asphalt_high: 6.00, metal_low: 11.00, metal_high: 13.00, tile_low: 13.00, tile_high: 15.75, flat_low: 5.55, flat_high: 6.95 },
    ne: { asphalt_low: 6.50, asphalt_high: 7.85, metal_low: 12.95, metal_high: 15.75, tile_low: 15.75, tile_high: 19.45, flat_low: 6.95, flat_high: 8.80 },
    mw: { asphalt_low: 5.55, asphalt_high: 6.95, metal_low: 12.05, metal_high: 14.80, tile_low: 13.90, tile_high: 17.60, flat_low: 6.00, flat_high: 7.85 },
    w:  { asphalt_low: 6.95, asphalt_high: 8.80, metal_low: 13.90, metal_high: 17.60, tile_low: 16.65, tile_high: 21.30, flat_low: 7.40, flat_high: 9.70 },
    sw: { asphalt_low: 5.40, asphalt_high: 6.50, metal_low: 12.05, metal_high: 14.80, tile_low: 13.90, tile_high: 18.50, flat_low: 5.55, flat_high: 7.40 },
  };
  const region = REGION_MAP[state.toUpperCase()] || "se";
  return FALLBACKS[region];
}
