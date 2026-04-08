// Daily health digest — runs every morning at 8am ET.
// Queries last 24 hours of SMS activity, then sends summary to
// admin email + #sms-health Slack channel.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Query all SMS stats in parallel
  const [
    { count: totalSent },
    { count: delivered },
    { count: failed },
    { count: inbound },
    { count: optOuts },
    { count: reviewsSent },
    { count: webhooksDelivered },
  ] = await Promise.all([
    supabase.from("sms_messages").select("*", { count: "exact", head: true })
      .eq("direction", "outbound").gte("created_at", since),
    supabase.from("sms_messages").select("*", { count: "exact", head: true })
      .eq("status", "delivered").gte("created_at", since),
    supabase.from("sms_messages").select("*", { count: "exact", head: true })
      .in("status", ["failed", "undelivered"]).gte("created_at", since),
    supabase.from("sms_messages").select("*", { count: "exact", head: true })
      .eq("direction", "inbound").gte("created_at", since),
    supabase.from("sms_opt_outs").select("*", { count: "exact", head: true })
      .gte("opted_out_at", since),
    supabase.from("review_requests").select("*", { count: "exact", head: true })
      .gte("created_at", since),
    supabase.from("sms_messages").select("*", { count: "exact", head: true })
      .eq("message_type", "webhook_delivery").gte("created_at", since),
  ]);

  const stats = {
    totalSent: totalSent || 0,
    delivered: delivered || 0,
    failed: failed || 0,
    inbound: inbound || 0,
    optOuts: optOuts || 0,
    reviewsSent: reviewsSent || 0,
    deliveryRate: (totalSent || 0) > 0
      ? Math.round(((delivered || 0) / (totalSent || 1)) * 100)
      : 100,
  };

  const isHealthy = stats.failed === 0 && stats.deliveryRate >= 90;
  const statusEmoji = isHealthy ? ":white_check_mark:" : ":warning:";
  const statusLabel = isHealthy ? "HEALTHY" : "NEEDS ATTENTION";

  // Send to Slack #sms-health
  const slackUrl = process.env.SLACK_DIGEST_WEBHOOK_URL;
  if (slackUrl) {
    const slackMessage = [
      `${statusEmoji} *Daily SMS Health — ${statusLabel}*`,
      "",
      `*Outbound:* ${stats.totalSent} sent · ${stats.delivered} delivered · ${stats.failed} failed`,
      `*Delivery rate:* ${stats.deliveryRate}%`,
      `*Inbound replies:* ${stats.inbound}`,
      `*Opt-outs:* ${stats.optOuts}`,
      `*Review requests:* ${stats.reviewsSent}`,
      "",
      stats.failed > 0 ? `:red_circle: ${stats.failed} message(s) failed — check Inngest dashboard` : "",
      stats.optOuts > 0 ? `:no_entry_sign: ${stats.optOuts} new opt-out(s)` : "",
    ].filter(Boolean).join("\n");

    await fetch(slackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: slackMessage }),
    }).catch((err) => console.error("Slack digest failed:", err));
  }

  // Send to admin email
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <div style="background:${isHealthy ? "#059669" : "#D97706"};border-radius:12px 12px 0 0;padding:16px 24px;">
          <h1 style="margin:0;font-size:16px;color:white;font-weight:600;">Daily SMS Health — ${statusLabel}</h1>
        </div>
        <div style="background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#6b7280;">Outbound SMS</td><td style="padding:6px 0;font-weight:600;text-align:right;">${stats.totalSent}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Delivered</td><td style="padding:6px 0;font-weight:600;text-align:right;color:#059669;">${stats.delivered}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Failed</td><td style="padding:6px 0;font-weight:600;text-align:right;${stats.failed > 0 ? "color:#DC2626;" : ""}">${stats.failed}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Delivery Rate</td><td style="padding:6px 0;font-weight:600;text-align:right;">${stats.deliveryRate}%</td></tr>
            <tr style="border-top:1px solid #f3f4f6;"><td style="padding:6px 0;color:#6b7280;">Inbound Replies</td><td style="padding:6px 0;font-weight:600;text-align:right;">${stats.inbound}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Opt-outs</td><td style="padding:6px 0;font-weight:600;text-align:right;">${stats.optOuts}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Review Requests</td><td style="padding:6px 0;font-weight:600;text-align:right;">${stats.reviewsSent}</td></tr>
          </table>
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">
            <a href="https://app.inngest.com" style="display:inline-block;background:#111827;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">
              View Inngest Dashboard
            </a>
          </div>
        </div>
        <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px;">RuufPro Daily Digest</p>
      </div>
    `;

    await resend.emails.send({
      from: "RuufPro <noreply@ruufpro.com>",
      to: "admin@getruufpro.com",
      subject: `${isHealthy ? "✅" : "⚠️"} SMS Health: ${stats.totalSent} sent, ${stats.delivered} delivered, ${stats.failed} failed`,
      html,
    });
  } catch (err) {
    console.error("Digest email failed:", err);
  }

  return NextResponse.json({ stats, healthy: isHealthy });
}
