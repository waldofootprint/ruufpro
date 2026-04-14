// Enrich prospects with owner name + email via Apollo People Enrichment API.
// POST body: { batch_id } — enriches all un-enriched leads in the batch.
//
// Apollo free tier = 50 credits/month. Each enrichment = 1 credit.
// Only enriches leads where owner_email is null.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOpsAuth } from "@/lib/ops-auth";

const APOLLO_API_URL = "https://api.apollo.io/api/v1/people/match";

export async function POST(req: NextRequest) {
  const auth = await requireOpsAuth();
  if (!auth.authorized) return auth.response;

  const { batch_id } = await req.json();

  if (!batch_id) {
    return NextResponse.json({ error: "batch_id required" }, { status: 400 });
  }

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "APOLLO_API_KEY not set" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find un-enriched leads (no owner_email AND not yet enriched).
  // The enriched_at check prevents double-credit burn on rapid clicks.
  const { data: leads, error } = await supabase
    .from("prospect_pipeline")
    .select("id, business_name, their_website_url, city, state")
    .eq("batch_id", batch_id)
    .is("owner_email", null)
    .is("enriched_at", null)
    .limit(50); // Cap at 50 to stay within free tier

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!leads?.length) {
    return NextResponse.json({ enriched: 0, already_enriched: true, message: "All leads already have emails" });
  }

  let enriched = 0;
  let noMatch = 0;
  let errors = 0;

  for (const lead of leads) {
    try {
      // Extract domain from website URL
      let domain = "";
      if (lead.their_website_url) {
        try {
          const url = new URL(lead.their_website_url.startsWith("http") ? lead.their_website_url : `https://${lead.their_website_url}`);
          domain = url.hostname.replace("www.", "");
        } catch {}
      }

      const res = await fetch(APOLLO_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          organization_name: lead.business_name,
          domain: domain || undefined,
          title: ["owner", "president", "ceo", "founder"],
        }),
      });

      if (!res.ok) {
        errors++;
        continue;
      }

      const data = await res.json();
      const person = data.person;

      if (person?.email) {
        await supabase
          .from("prospect_pipeline")
          .update({
            owner_name: [person.first_name, person.last_name].filter(Boolean).join(" ") || null,
            owner_email: person.email,
            enriched_at: new Date().toISOString(),
            stage: "enriched",
            stage_entered_at: new Date().toISOString(),
          })
          .eq("id", lead.id);
        enriched++;
      } else {
        // No email found — still advance to "enriched" so it's clear
        // this lead was processed and can proceed to site building.
        await supabase
          .from("prospect_pipeline")
          .update({
            enriched_at: new Date().toISOString(),
            stage: "enriched",
            stage_entered_at: new Date().toISOString(),
          })
          .eq("id", lead.id);
        noMatch++;
      }

      // Rate limit — 1 second between calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {
      errors++;
    }
  }

  return NextResponse.json({
    enriched,
    no_match: noMatch,
    errors,
    total_processed: leads.length,
    credits_used: leads.length,
  });
}
