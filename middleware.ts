import { NextRequest, NextResponse } from "next/server";

// Multi-tenant subdomain routing middleware.
//
// How it works:
// 1. A request comes in (e.g., "joes-roofing.roofready.com")
// 2. We extract the subdomain ("joes-roofing")
// 3. We rewrite the URL to "/site/joes-roofing" internally
// 4. Next.js renders the contractor's site using that slug
//
// The visitor never sees "/site/joes-roofing" — they just see
// "joes-roofing.roofready.com" in their browser.
//
// For local dev, we use "joes-roofing.localhost:3000" instead.

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Define which hostnames are "ours" (the main app, not a contractor site).
  // In production, this is "roofready.com". In dev, "localhost:3000".
  const allowedDomains = ["roofready.com", "www.roofready.com"];
  const isLocalhost = hostname.includes("localhost");

  // Extract the subdomain.
  // "joes-roofing.roofready.com" → "joes-roofing"
  // "joes-roofing.localhost:3000" → "joes-roofing"
  let currentHost: string;
  if (isLocalhost) {
    currentHost = hostname.split(".localhost")[0];
  } else {
    currentHost = hostname.replace(".roofready.com", "");
  }

  // If there's no subdomain (user is on roofready.com itself), serve the main app.
  if (allowedDomains.includes(hostname) || currentHost === "localhost:3000") {
    return NextResponse.next();
  }

  // Otherwise, rewrite to the contractor's site page.
  // "joes-roofing.roofready.com/anything" → "/site/joes-roofing/anything"
  url.pathname = `/site/${currentHost}${url.pathname}`;
  return NextResponse.rewrite(url);
}
