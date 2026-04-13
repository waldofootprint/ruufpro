import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Multi-tenant routing middleware.
//
// Handles two routing modes:
// 1. Subdomain: "joes-roofing.ruufpro.com" → rewrite to "/site/joes-roofing"
// 2. Custom domain: "joesroofing.com" → lookup contractor by custom_domain → rewrite to "/site/{slug}"
//
// For local dev, use "joes-roofing.localhost:3000" for subdomains.

export const config = {
  matcher: [
    // Match all paths except static files, Next.js internals, and app routes
    "/((?!api/|_next/|_static/|_vercel|preview/|dashboard/|login/|signup/|onboarding/|widget-preview/|mission-control/|sitemap|robots|[\\w-]+\\.\\w+).*)",
  ],
};

// Simple in-memory cache for custom domain lookups (avoids DB hit on every request).
const domainCache = new Map<string, { slug: string; expires: number }>();
const CACHE_TTL = 5 * 60_000; // 5 minutes

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Define which hostnames are "ours" (the main app, not a contractor site).
  const allowedDomains = ["ruufpro.com", "www.ruufpro.com", "ruufpro.vercel.app"];
  const isLocalhost = hostname.includes("localhost");

  // If it's our main domain, serve the main app.
  if (allowedDomains.includes(hostname) || hostname === "localhost:3000") {
    return NextResponse.next();
  }

  // Check for subdomain routing first.
  // "joes-roofing.ruufpro.com" → "joes-roofing"
  const isSubdomain = hostname.endsWith(".ruufpro.com") || (isLocalhost && hostname.includes(".localhost"));

  if (isSubdomain) {
    let currentHost: string;
    if (isLocalhost) {
      currentHost = hostname.split(".localhost")[0];
    } else {
      currentHost = hostname.replace(".ruufpro.com", "");
    }
    url.pathname = `/site/${currentHost}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Custom domain routing — look up the contractor by their custom_domain.
  const cleanHost = hostname.replace(/:\d+$/, ""); // strip port

  // Check cache first
  const cached = domainCache.get(cleanHost);
  if (cached && Date.now() < cached.expires) {
    url.pathname = `/site/${cached.slug}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Look up in database
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id, sites(slug)")
      .eq("custom_domain", cleanHost)
      .single();

    const site = Array.isArray(contractor?.sites) ? contractor.sites[0] : contractor?.sites;
    if (site?.slug) {
      domainCache.set(cleanHost, { slug: site.slug, expires: Date.now() + CACHE_TTL });
      url.pathname = `/site/${site.slug}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  } catch {
    // DB lookup failed — fall through to next
  }

  // Unknown domain — serve main app (will 404 naturally)
  return NextResponse.next();
}
