import { inngest } from "./client";

// ---------------------------------------------------------------------------
// Chain 1: Lead Auto-Response
// Trigger: "sms/lead.created" — emitted from /api/notify after form submit
// Steps: look up contractor → check SMS enabled → check opt-out → send SMS
// ---------------------------------------------------------------------------
export const leadAutoResponse = inngest.createFunction(
  {
    id: "lead-auto-response",
    retries: 3,
    triggers: [{ event: "sms/lead.created" }],
  },
  async ({ event, step }) => {
    const { contractorId, leadPhone, leadName } = event.data;

    if (!leadPhone) {
      return { success: true, skipped: true, reason: "no phone number" };
    }

    const result = await step.run("send-auto-response-sms", async () => {
      const { sendLeadAutoResponse } = await import("@/lib/sms-workflows");
      return sendLeadAutoResponse(contractorId, leadPhone, leadName);
    });

    if (!result.success) {
      throw new Error(`Lead auto-response failed: ${result.error}`);
    }

    return result;
  }
);

// ---------------------------------------------------------------------------
// Chain 2: Missed-Call Text-Back
// Trigger: "sms/call.missed" — emitted from /api/sms/voice-webhook
// Steps: dedup check → send textback SMS
// ---------------------------------------------------------------------------
export const missedCallTextback = inngest.createFunction(
  {
    id: "missed-call-textback",
    retries: 3,
    idempotency: "event.data.callSid",
    triggers: [{ event: "sms/call.missed" }],
  },
  async ({ event, step }) => {
    const { contractorId, callerPhone } = event.data;

    // Dedup: check if we already texted this number in the last 30 min
    const shouldSend = await step.run("check-dedup", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      const thirtyMinAgo = new Date(
        Date.now() - 30 * 60 * 1000
      ).toISOString();

      const { data: recentText } = await supabase
        .from("sms_messages")
        .select("id")
        .eq("to_number", callerPhone)
        .eq("message_type", "missed_call_textback")
        .gte("created_at", thirtyMinAgo)
        .limit(1)
        .single();

      return !recentText;
    });

    if (!shouldSend) {
      return { success: true, skipped: true, reason: "dedup — already texted within 30 min" };
    }

    const result = await step.run("send-missed-call-textback", async () => {
      const { sendMissedCallTextback } = await import("@/lib/sms-workflows");
      return sendMissedCallTextback(contractorId, callerPhone);
    });

    if (!result.success) {
      throw new Error(`Missed-call textback failed: ${result.error}`);
    }

    return result;
  }
);

// ---------------------------------------------------------------------------
// Chain 3: Review Request
// Trigger: "sms/review.requested" — emitted from /api/reviews/request
// Steps: send review SMS (workflow handles all validation + tracking)
// ---------------------------------------------------------------------------
export const reviewRequest = inngest.createFunction(
  {
    id: "review-request-sms",
    retries: 3,
    triggers: [{ event: "sms/review.requested" }],
  },
  async ({ event, step }) => {
    const { contractorId, leadId } = event.data;

    const result = await step.run("send-review-request", async () => {
      const { sendReviewRequest } = await import("@/lib/sms-workflows");
      return sendReviewRequest(contractorId, leadId);
    });

    if (!result.success) {
      throw new Error(`Review request failed: ${result.error}`);
    }

    return result;
  }
);

// ---------------------------------------------------------------------------
// Chain 4: Review Email Follow-Up
// Trigger: "sms/review.followup-needed" — emitted from cron job
// Steps: send follow-up email for unclicked review links
// ---------------------------------------------------------------------------
export const reviewEmailFollowup = inngest.createFunction(
  {
    id: "review-email-followup",
    retries: 3,
    triggers: [{ event: "sms/review.followup-needed" }],
  },
  async ({ event, step }) => {
    const { reviewRequestId } = event.data;

    const result = await step.run("send-followup-email", async () => {
      const { scheduleReviewEmailFollowup } = await import(
        "@/lib/sms-workflows"
      );
      return scheduleReviewEmailFollowup(reviewRequestId);
    });

    if (!result.success) {
      throw new Error(`Review email follow-up failed: ${result.error}`);
    }

    return result;
  }
);

// ---------------------------------------------------------------------------
// Chain 5: CRM Webhook Export
// Trigger: "sms/lead.created" — same event as auto-response
// Steps: look up contractor webhook config → POST lead data to webhook URL
// ---------------------------------------------------------------------------
export const crmWebhookExport = inngest.createFunction(
  {
    id: "crm-webhook-export",
    retries: 3,
    triggers: [{ event: "sms/lead.created" }],
  },
  async ({ event, step }) => {
    const { contractorId } = event.data;

    // Step 1: Check if contractor has webhook enabled
    const webhookConfig = await step.run("check-webhook-config", async () => {
      const { createServerSupabase } = await import("@/lib/supabase-server");
      const supabase = createServerSupabase();

      const { data } = await supabase
        .from("contractors")
        .select("webhook_url, webhook_enabled, business_name")
        .eq("id", contractorId)
        .single();

      return data;
    });

    if (!webhookConfig?.webhook_enabled || !webhookConfig?.webhook_url) {
      return { success: true, skipped: true, reason: "webhook not enabled" };
    }

    // Step 2: POST lead data to webhook URL
    const result = await step.run("post-to-webhook", async () => {
      const sourceLabels: Record<string, string> = {
        estimate_widget: "Estimate Widget",
        contact_form: "Contact Form",
        external_widget: "External Widget",
        address_only: "Address Only",
        outside_area: "Outside Service Area",
      };
      const sourceTag = sourceLabels[event.data.source] || event.data.source;

      const payload = {
        event: "lead.created",
        timestamp: new Date().toISOString(),
        tags: ["RuufPro", sourceTag],
        contractor: {
          id: contractorId,
          business_name: webhookConfig.business_name,
        },
        lead: {
          name: event.data.leadName,
          phone: event.data.leadPhone,
          email: event.data.leadEmail,
          address: event.data.leadAddress,
          message: event.data.leadMessage,
          source: event.data.source,
          timeline: event.data.timeline,
          financing_interest: event.data.financingInterest,
          estimate: event.data.estimateLow
            ? {
                low: event.data.estimateLow,
                high: event.data.estimateHigh,
                material: event.data.estimateMaterial,
                roof_sqft: event.data.estimateRoofSqft,
              }
            : null,
        },
      };

      const resp = await fetch(webhookConfig.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error(`Webhook POST failed: ${resp.status} ${resp.statusText}`);
      }

      return { status: resp.status, delivered: true };
    });

    return { success: true, ...result };
  }
);

// ---------------------------------------------------------------------------
// Chain 1 bonus: Push Notification (was also fire-and-forget)
// ---------------------------------------------------------------------------
export const leadPushNotification = inngest.createFunction(
  {
    id: "lead-push-notification",
    retries: 2,
    triggers: [{ event: "sms/lead.created" }],
  },
  async ({ event, step }) => {
    const { contractorId, pushTitle, pushBody, origin } = event.data;

    if (!origin) return { success: true, skipped: true, reason: "no origin URL" };

    await step.run("send-push-notification", async () => {
      const res = await fetch(`${origin}/api/push/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.SUPABASE_SERVICE_ROLE_KEY!,
        },
        body: JSON.stringify({
          contractor_id: contractorId,
          title: pushTitle,
          body: pushBody,
        }),
      });

      if (!res.ok) {
        throw new Error(`Push notification failed: ${res.status}`);
      }
    });

    return { success: true };
  }
);
