// Custom domain management API — add, remove, verify domains.
// Pro tier ($149/mo).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthSupabase } from "@/lib/supabase-server";
import { addDomain, removeDomain, verifyDomain, getDomainConfig } from "@/lib/vercel-domains";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Detect apex vs subdomain and return correct DNS instructions.
function getDnsInstructions(domain: string) {
  const parts = domain.split(".");
  const isApex = parts.length === 2; // e.g. "example.com"
  if (isApex) {
    return { type: "A", name: "@", value: "76.76.21.21" };
  }
  return { type: "CNAME", name: parts[0], value: "cname.vercel-dns.com" };
}

// Basic domain format validation.
const DOMAIN_REGEX = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

// GET — fetch contractor's current custom domain with verification status
export async function GET() {
  const authSupabase = createAuthSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data: contractor } = await supabase
    .from("contractors")
    .select("custom_domain, has_custom_domain")
    .eq("user_id", user.id)
    .single();

  if (!contractor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!contractor.custom_domain) {
    return NextResponse.json({ domain: null, enabled: contractor.has_custom_domain });
  }

  // Check current verification status from Vercel
  const config = await getDomainConfig(contractor.custom_domain);
  const verified = config?.verified ?? false;

  return NextResponse.json({
    domain: contractor.custom_domain,
    enabled: contractor.has_custom_domain,
    verified,
    dns: verified ? null : getDnsInstructions(contractor.custom_domain),
  });
}

// POST — add or verify a custom domain
export async function POST(req: NextRequest) {
  const authSupabase = createAuthSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, has_custom_domain")
    .eq("user_id", user.id)
    .single();

  if (!contractor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!contractor.has_custom_domain) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const { action, domain } = await req.json();

  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Domain required" }, { status: 400 });
  }

  // Sanitize domain
  const cleanDomain = domain.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");

  // Validate domain format
  if (!DOMAIN_REGEX.test(cleanDomain)) {
    return NextResponse.json({ error: "Please enter a valid domain (e.g. yourbusiness.com)" }, { status: 400 });
  }

  if (action === "add") {
    const result = await addDomain(cleanDomain);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Save to contractor record
    await supabase
      .from("contractors")
      .update({ custom_domain: cleanDomain })
      .eq("id", contractor.id);

    return NextResponse.json({
      domain: result.domain,
      dns: getDnsInstructions(cleanDomain),
    });
  }

  if (action === "verify") {
    const result = await verifyDomain(cleanDomain);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// DELETE — remove custom domain
export async function DELETE(req: NextRequest) {
  const authSupabase = createAuthSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, custom_domain")
    .eq("user_id", user.id)
    .single();

  if (!contractor?.custom_domain) {
    return NextResponse.json({ error: "No domain configured" }, { status: 404 });
  }

  await removeDomain(contractor.custom_domain);

  await supabase
    .from("contractors")
    .update({ custom_domain: null })
    .eq("id", contractor.id);

  return NextResponse.json({ ok: true });
}
