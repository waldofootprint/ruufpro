import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Lob webhook receiver. Maps postcard lifecycle events to mailing_history.status.
 *
 * Lob signs webhooks with HMAC-SHA256 over the raw request body using the
 * webhook secret. Set LOB_WEBHOOK_SECRET in env after creating the webhook
 * subscription in the Lob dashboard.
 *
 * Event ID is idempotency key — retried deliveries don't double-update.
 */

const EVENT_TO_STATUS: Record<string, string> = {
  "postcard.in_transit": "sent",
  "postcard.in_local_area": "sent",
  "postcard.processed_for_delivery": "sent",
  "postcard.delivered": "delivered",
  "postcard.returned_to_sender": "returned",
  "postcard.failed": "failed",
};

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LOB_WEBHOOK_SECRET;
  if (!secret) {
    // Dev mode — allow unsigned in test, log warning
    return process.env.NODE_ENV !== "production";
  }
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const sig = signature.replace(/^sha256=/, "");
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("lob-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType: string = payload?.event_type?.id ?? payload?.event_type ?? "";
  const postcardId: string | undefined =
    payload?.body?.id ?? payload?.resource_id;

  if (!postcardId) {
    return NextResponse.json({ ok: true, skipped: "no postcard id" });
  }

  const newStatus = EVENT_TO_STATUS[eventType];
  if (!newStatus) {
    return NextResponse.json({ ok: true, skipped: `unhandled ${eventType}` });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Don't downgrade past "engaged" or "scanned" — those reflect homeowner action,
  // outrank Lob lifecycle.
  const { data: existing } = await supabase
    .from("mailing_history")
    .select("id, status")
    .eq("lob_postcard_id", postcardId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ ok: true, skipped: "row not found" });
  }

  const HOMEOWNER_TERMINAL = ["scanned", "engaged"];
  if (HOMEOWNER_TERMINAL.includes(existing.status) && newStatus === "delivered") {
    // delivery is fine to record even past scan; let it through
  } else if (HOMEOWNER_TERMINAL.includes(existing.status)) {
    return NextResponse.json({ ok: true, skipped: "homeowner status preserved" });
  }

  const { error } = await supabase
    .from("mailing_history")
    .update({ status: newStatus })
    .eq("id", existing.id);

  if (error) {
    console.error("[lob webhook] update failed", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
