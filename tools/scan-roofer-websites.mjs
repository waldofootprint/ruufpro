// Fetch each prospect's homepage and detect competitor chatbots / estimate widgets.
// Reads .tmp/manatee-final.json, writes .tmp/manatee-with-tools.json.
//
// Detection: signature strings in the HTML (script src, inline config, brand mentions).
// We err on the side of false positives — the column says "what we found", Hannah
// makes the final call. We DO NOT distinguish "AI" chatbot from generic — any chat
// widget is disqualifying per Hannah's rule.
//
// Run: node tools/scan-roofer-websites.mjs

import fs from "node:fs";

const rows = JSON.parse(fs.readFileSync(".tmp/manatee-final.json", "utf8"));

// Signature → label. Order matters slightly (more specific first for cleaner labels).
const SIGNATURES = [
  // Chatbots (any chat widget = disqualifying)
  [/intercom\.io|widget\.intercom|app\.intercom\.com/i, "Intercom"],
  [/drift\.com|js\.driftt\.com|driftt\.com/i, "Drift"],
  [/tidio\.co|code\.tidio\.co/i, "Tidio"],
  [/livechatinc\.com|cdn\.livechatinc/i, "LiveChat"],
  [/crisp\.chat|client\.crisp\.chat/i, "Crisp"],
  [/hs-scripts\.com|hubspot\.com\/scripts|hsforms\.net/i, "HubSpot"],
  [/zdassets\.com|zendesk\.com\/embeddable/i, "Zendesk"],
  [/embed\.tawk\.to|tawk\.to/i, "Tawk.to"],
  [/podium\.com|assets\.podium/i, "Podium"],
  [/birdeye\.com|cdn\.birdeye/i, "Birdeye"],
  [/nicejob\.co|nicejob\.com/i, "NiceJob"],
  [/leadconnectorhq|highlevel|gohighlevel/i, "HighLevel/GHL"],
  [/messenger\/customerchat|connect\.facebook\.net.*Messenger/i, "FB Messenger Chat"],
  [/widget\.manychat\.com|manychat/i, "ManyChat"],
  [/chatfuel/i, "Chatfuel"],
  [/ada\.support|static\.ada\.cx/i, "Ada"],
  [/freshchat|wchat\.freshchat/i, "Freshchat"],
  [/olark\.com|static\.olark/i, "Olark"],
  [/snapengage/i, "SnapEngage"],
  [/userlike\.com/i, "Userlike"],
  [/smartsupp/i, "Smartsupp"],
  [/jivochat|jivosite/i, "JivoChat"],
  [/gorgias/i, "Gorgias"],
  [/customerly/i, "Customerly"],
  [/voiceflow\.com|cdn\.voiceflow/i, "Voiceflow"],
  // Estimate widgets
  [/roofle\.com|widget\.roofle/i, "Roofle"],
  [/roofr\.com\/embed|app\.roofr\.com/i, "Roofr"],
  [/iroofing\.io|iroofing\.com/i, "iRoofing"],
  [/instantroofer/i, "InstantRoofer"],
  [/roofquotepro|roofquote/i, "RoofQuote"],
  [/getjobber\.com\/instant-quote|jobber.*estimate/i, "Jobber Estimator"],
  // Generic estimator/calc heuristics (page-level — phrasing on contact/quote pages)
  [/instant\s*(?:roof\s*)?(?:quote|estimate|price)/i, "Instant Quote (heuristic)"],
  [/<[^>]+(id|class)=["'][^"']*(?:price|estimate|quote)[-_ ]?(?:calculator|widget|tool)/i, "Estimator widget (heuristic)"],
  // Generic chatbot heuristics
  [/<[^>]+(id|class)=["'][^"']*(?:chat[-_ ]?bot|chat[-_ ]?widget|ai[-_ ]?assistant)/i, "Chatbot (heuristic)"],
];

async function fetchHtml(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const html = await res.text();
    return { ok: true, html };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  } finally {
    clearTimeout(timer);
  }
}

function detect(html) {
  const found = new Set();
  for (const [re, label] of SIGNATURES) {
    if (re.test(html)) found.add(label);
  }
  return [...found];
}

async function processRow(row) {
  if (!row.website) return { ...row, tools_detected: [], scan_error: "" };
  let url = row.website.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const r = await fetchHtml(url);
  if (!r.ok) {
    // Retry on http if https failed
    if (url.startsWith("https://")) {
      const r2 = await fetchHtml("http://" + url.slice(8));
      if (r2.ok) return { ...row, tools_detected: detect(r2.html), scan_error: "" };
    }
    return { ...row, tools_detected: [], scan_error: r.error };
  }
  return { ...row, tools_detected: detect(r.html), scan_error: "" };
}

// Concurrency pool
async function pool(items, n, worker) {
  const results = new Array(items.length);
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
      if ((idx + 1) % 10 === 0) console.error(`  ${idx + 1}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: n }, run));
  return results;
}

console.error(`Scanning ${rows.length} websites…`);
const enriched = await pool(rows, 10, processRow);

let withTools = 0;
let errored = 0;
for (const r of enriched) {
  if (r.tools_detected.length > 0) withTools++;
  if (r.scan_error) errored++;
}
console.error(`\nDone. ${withTools} have detected tools · ${errored} fetch errors`);

fs.writeFileSync(".tmp/manatee-with-tools.json", JSON.stringify(enriched, null, 2));
