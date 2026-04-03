import { NextRequest, NextResponse } from "next/server";

// Multi-tenant subdomain routing middleware.
//
// How it works:
// 1. A request comes in (e.g., "joes-roofing.ruufpro.com")
// 2. We extract the subdomain ("joes-roofing")
// 3. We rewrite the URL to "/site/joes-roofing" internally
// 4. Next.js renders the contractor's site using that slug
//
// The visitor never sees "/site/joes-roofing" — they just see
// "joes-roofing.ruufpro.com" in their browser.
//
// For local dev, we use "joes-roofing.localhost:3000" instead.

export const config = {
  matcher: [
    // Match all paths except static files, Next.js internals, and app routes
    "/((?!api/|_next/|_static/|_vercel|preview/|dashboard/|login/|signup/|onboarding/|widget-preview/|mission-control/|sitemap|robots|[\\w-]+\\.\\w+).*)",
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Define which hostnames are "ours" (the main app, not a contractor site).
  // In production, this is "ruufpro.com". In dev, "localhost:3000".
  const allowedDomains = ["ruufpro.com", "www.ruufpro.com", "ruufpro.vercel.app"];
  const isLocalhost = hostname.includes("localhost");

  // Extract the subdomain.
  // "joes-roofing.ruufpro.com" → "joes-roofing"
  // "joes-roofing.localhost:3000" → "joes-roofing"
  let currentHost: string;
  if (isLocalhost) {
    currentHost = hostname.split(".localhost")[0];
  } else {
    currentHost = hostname.replace(".ruufpro.com", "");
  }

  // If there's no subdomain (user is on ruufpro.com itself), serve the main app.
  if (allowedDomains.includes(hostname) || currentHost === "localhost:3000") {
    return NextResponse.next();
  }

  // Otherwise, rewrite to the contractor's site page.
  // "joes-roofing.ruufpro.com/anything" → "/site/joes-roofing/anything"
  url.pathname = `/site/${currentHost}${url.pathname}`;
  return NextResponse.rewrite(url);
}
