// Morning summary — runs daily at 7am ET (11:00 UTC during EDT).
// Single email covering SMS health, outreach pipeline, system status.
// If this email doesn't arrive, something is deeply wrong.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "admin@getruufpro.com";

type OverallStatus = "green" | "yellow" | "red";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // ── All queries in parallel ──────────────────────────────────────────
  const [
    // SMS Health (6 queries)
    { count: totalSent },
    { count: delivered },
    { count: failed },
    { count: inboundReplies },
    { count: optOuts },
    { count: reviewsSent },
    // Outreach Pipeline (5 queries)
    { count: prospects },
    { count: previewViews },
    { count: outreachSent },
    { count: pendingDrafts },
    { count: interestedReplies },
    // Cron inference (2 queries)
    latestSmsResult,
    latestFollowupResult,
  ] = await Promise.all([
    // SMS
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
    // Outreach
    supabase.from("contractors").select("*", { count: "exact", head: true })
      .eq("is_prospect", true),
    supabase.from("prospect_views").select("*", { count: "exact", head: true }),
    supabase.from("command_outreach").select("*", { count: "exact", head: true }),
    supabase.from("outreach_replies").select("*", { count: "exact", head: true })
      .in("status", ["draft", "pending"]),
    supabase.from("outreach_replies").select("*", { count: "exact", head: true })
      .eq("category", "interested"),
    // Cron health inference
    supabase.from("sms_messages").select("created_at")
      .eq("direction", "outbound").order("created_at", { ascending: false }).limit(1),
    supabase.from("review_requests").select("email_followup_sent_at")
      .not("email_followup_sent_at", "is", null)
      .order("email_followup_sent_at", { ascending: false }).limit(1),
  ]);

  // ── Twilio balance (separate, 5s timeout) ────────────────────────────
  let twilioBalance: string | null = null;
  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const balance = await client.balance.fetch();
    clearTimeout(timeout);
    twilioBalance = balance.balance;
  } catch (err) {
    console.error("Twilio balance fetch failed:", err);
  }

  // ── Compute metrics ──────────────────────────────────────────────────
  const sms = {
    totalSent: totalSent || 0,
    delivered: delivered || 0,
    failed: failed || 0,
    inbound: inboundReplies || 0,
    optOuts: optOuts || 0,
    reviewsSent: reviewsSent || 0,
    deliveryRate: (totalSent || 0) > 0
      ? Math.round(((delivered || 0) / (totalSent || 1)) * 100)
      : 100,
  };

  const outreach = {
    prospects: prospects || 0,
    previewViews: previewViews || 0,
    outreachSent: outreachSent || 0,
    pendingDrafts: pendingDrafts || 0,
    interestedReplies: interestedReplies || 0,
  };

  // Cron health: check if latest records are within 48h (generous window)
  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
  const latestSmsTime = latestSmsResult.data?.[0]?.created_at
    ? new Date(latestSmsResult.data[0].created_at).getTime() : 0;
  const latestFollowupTime = latestFollowupResult.data?.[0]?.email_followup_sent_at
    ? new Date(latestFollowupResult.data[0].email_followup_sent_at).getTime() : 0;

  const twilioBalanceNum = twilioBalance ? parseFloat(twilioBalance) : null;

  // ── Overall status ───────────────────────────────────────────────────
  const issues: string[] = [];

  if (sms.failed > 0) issues.push(`${sms.failed} SMS failed`);
  if (sms.deliveryRate < 80) issues.push(`Delivery rate ${sms.deliveryRate}% (critical)`);
  else if (sms.deliveryRate < 90) issues.push(`Delivery rate ${sms.deliveryRate}%`);
  if (twilioBalanceNum !== null && twilioBalanceNum < 5) issues.push(`Twilio balance $${twilioBalance} (critical)`);
  else if (twilioBalanceNum !== null && twilioBalanceNum < 10) issues.push(`Twilio balance $${twilioBalance}`);
  if (outreach.pendingDrafts > 0) issues.push(`${outreach.pendingDrafts} reply drafts waiting`);
  if (outreach.interestedReplies > 0) issues.push(`${outreach.interestedReplies} interested leads need follow-up`);

  let overall: OverallStatus = "green";
  if (sms.failed > 0 || sms.deliveryRate < 80 || (twilioBalanceNum !== null && twilioBalanceNum < 5)) {
    overall = "red";
  } else if (issues.length > 0) {
    overall = "yellow";
  }

  const statusColor = overall === "green" ? "#059669" : overall === "yellow" ? "#D97706" : "#DC2626";
  const statusLabel = overall === "green" ? "All Systems Green" : `${issues.length} Item${issues.length === 1 ? "" : "s"} Need${issues.length === 1 ? "s" : ""} Attention`;
  const statusEmoji = overall === "green" ? "\u2705" : overall === "yellow" ? "\u26A0\uFE0F" : "\uD83D\uDED1";

  // ── Build email HTML ─────────────────────────────────────────────────
  const row = (label: string, value: string | number, color?: string) =>
    `<tr><td style="padding:5px 0;color:#6b7280;font-size:13px;">${label}</td><td style="padding:5px 0;font-weight:600;text-align:right;font-size:13px;${color ? `color:${color};` : ""}">${value}</td></tr>`;

  const sectionHeader = (title: string) =>
    `<tr><td colspan="2" style="padding:14px 0 6px;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#374151;border-bottom:1px solid #e5e7eb;">${title}</td></tr>`;

  const cronCheck = (name: string, lastTime: number) => {
    const healthy = lastTime > fortyEightHoursAgo;
    const icon = healthy ? "\u2705" : "\u274C";
    const timeStr = lastTime > 0 ? new Date(lastTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Never";
    return row(`${icon} ${name}`, timeStr);
  };

  const issuesList = issues.length > 0
    ? `<div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:12px 16px;margin-bottom:16px;">
        <p style="margin:0 0 6px;font-weight:700;font-size:12px;color:#92400E;text-transform:uppercase;">Action Items</p>
        ${issues.map(i => `<p style="margin:2px 0;font-size:13px;color:#78350F;">\u2022 ${i}</p>`).join("")}
      </div>`
    : "";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="background:${statusColor};border-radius:12px 12px 0 0;padding:16px 24px;">
        <h1 style="margin:0;font-size:16px;color:white;font-weight:600;">${statusEmoji} ${statusLabel}</h1>
        <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.8);">RuufPro Morning Summary &mdash; ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>
      <div style="background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
        ${issuesList}
        <table style="width:100%;border-collapse:collapse;">
          ${sectionHeader("SMS Health (24h)")}
          ${row("Outbound Sent", sms.totalSent)}
          ${row("Delivered", sms.delivered, "#059669")}
          ${row("Failed", sms.failed, sms.failed > 0 ? "#DC2626" : undefined)}
          ${row("Delivery Rate", `${sms.deliveryRate}%`, sms.deliveryRate < 90 ? "#DC2626" : "#059669")}
          ${row("Inbound Replies", sms.inbound)}
          ${row("Opt-outs", sms.optOuts, sms.optOuts > 0 ? "#D97706" : undefined)}
          ${row("Review Requests", sms.reviewsSent)}

          ${sectionHeader("Outreach Pipeline")}
          ${row("Prospects in DB", outreach.prospects)}
          ${row("Preview Views", outreach.previewViews)}
          ${row("Outreach Sent", outreach.outreachSent)}
          ${row("Pending Reply Drafts", outreach.pendingDrafts, outreach.pendingDrafts > 0 ? "#D97706" : undefined)}
          ${row("Interested Replies", outreach.interestedReplies, outreach.interestedReplies > 0 ? "#059669" : undefined)}

          ${sectionHeader("System Status")}
          ${cronCheck("Daily Digest", latestSmsTime)}
          ${cronCheck("Review Follow-ups", latestFollowupTime)}
          ${row("Twilio Balance", twilioBalance ? `$${twilioBalance}` : "Unknown", twilioBalanceNum !== null && twilioBalanceNum < 10 ? "#DC2626" : undefined)}
        </table>

        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;text-align:center;">
          <a href="https://ruufpro.com/command-center?tab=health" style="display:inline-block;background:#111827;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">
            Open Health Dashboard
          </a>
        </div>
      </div>
      <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px;">RuufPro Morning Summary</p>
    </div>
  `;

  // ── Send email ───────────────────────────────────────────────────────
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "RuufPro <noreply@ruufpro.com>",
      to: ADMIN_EMAIL,
      subject: `${statusEmoji} Morning Summary: ${statusLabel}`,
      html,
    });
  } catch (err) {
    console.error("Morning summary email failed:", err);
  }

  // ── Also send to Slack ───────────────────────────────────────────────
  const slackUrl = process.env.SLACK_DIGEST_WEBHOOK_URL;
  if (slackUrl) {
    const slackIcon = overall === "green" ? ":white_check_mark:" : overall === "yellow" ? ":warning:" : ":red_circle:";
    const slackText = [
      `${slackIcon} *Morning Summary — ${statusLabel}*`,
      "",
      `*SMS (24h):* ${sms.totalSent} sent · ${sms.delivered} delivered · ${sms.failed} failed · ${sms.deliveryRate}% rate`,
      `*Outreach:* ${outreach.prospects} prospects · ${outreach.outreachSent} sent · ${outreach.pendingDrafts} drafts waiting`,
      `*Twilio:* ${twilioBalance ? `$${twilioBalance}` : "Unknown"}`,
      "",
      ...(issues.length > 0 ? [":point_right: *Action items:*", ...issues.map(i => `  • ${i}`)] : []),
    ].filter(Boolean).join("\n");

    await fetch(slackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: slackText }),
    }).catch((err) => console.error("Slack morning summary failed:", err));
  }

  return NextResponse.json({ sms, outreach, overall, issues });
}
