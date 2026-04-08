// Shared alert sender — emails admin + posts to Slack on system failures.
// Used by Inngest global failure handler and future monitoring.

import { Resend } from "resend";

const ADMIN_EMAIL = "admin@getruufpro.com";

interface AlertPayload {
  title: string;
  message: string;
  details?: Record<string, string | number | null | undefined>;
  severity?: "error" | "warning" | "info";
}

export async function sendAlert(payload: AlertPayload) {
  const { title, message, details, severity = "error" } = payload;

  const results = await Promise.allSettled([
    sendAlertEmail(title, message, details, severity),
    sendAlertSlack(title, message, details, severity),
  ]);

  const emailOk = results[0].status === "fulfilled";
  const slackOk = results[1].status === "fulfilled";

  if (!emailOk) console.error("Alert email failed:", (results[0] as PromiseRejectedResult).reason);
  if (!slackOk) console.error("Alert Slack failed:", (results[1] as PromiseRejectedResult).reason);

  return { emailOk, slackOk };
}

async function sendAlertEmail(
  title: string,
  message: string,
  details?: Record<string, string | number | null | undefined>,
  severity?: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const sevColor = severity === "error" ? "#DC2626" : severity === "warning" ? "#D97706" : "#2563EB";
  const sevLabel = (severity || "error").toUpperCase();

  const detailRows = details
    ? Object.entries(details)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-size:13px;color:#6b7280;">${k}</td><td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${v}</td></tr>`)
        .join("")
    : "";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="background:${sevColor};border-radius:12px 12px 0 0;padding:16px 24px;">
        <h1 style="margin:0;font-size:16px;color:white;font-weight:600;">${sevLabel}: ${title}</h1>
      </div>
      <div style="background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
        <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">${message}</p>
        ${detailRows ? `<table style="width:100%;border-collapse:collapse;">${detailRows}</table>` : ""}
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">
          <a href="https://app.inngest.com" style="display:inline-block;background:#111827;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">
            View in Inngest Dashboard
          </a>
        </div>
      </div>
      <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px;">RuufPro System Alert</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: "RuufPro Alerts <noreply@ruufpro.com>",
    to: ADMIN_EMAIL,
    subject: `[${sevLabel}] ${title}`,
    html,
  });

  if (error) throw new Error(`Alert email failed: ${JSON.stringify(error)}`);
}

async function sendAlertSlack(
  title: string,
  message: string,
  details?: Record<string, string | number | null | undefined>,
  severity?: string
) {
  const webhookUrl = process.env.SLACK_ALERTS_WEBHOOK_URL;
  if (!webhookUrl) return; // Slack not configured yet — skip silently

  const emoji = severity === "error" ? ":red_circle:" : severity === "warning" ? ":warning:" : ":information_source:";

  const detailLines = details
    ? Object.entries(details)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `*${k}:* ${v}`)
        .join("\n")
    : "";

  const resp = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `${emoji} *${title}*\n${message}${detailLines ? "\n" + detailLines : ""}`,
    }),
  });

  if (!resp.ok) throw new Error(`Slack webhook failed: ${resp.status}`);
}
