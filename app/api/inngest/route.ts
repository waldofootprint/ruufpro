import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  globalFailureHandler,
  leadAutoResponse,
  missedCallTextback,
  reviewRequest,
  reviewEmailFollowup,
  leadPushNotification,
  crmWebhookExport,
  crmDirectPush,
  crmTokenRefresh,
  inboundSmsNotification,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    globalFailureHandler,
    leadAutoResponse,
    missedCallTextback,
    reviewRequest,
    reviewEmailFollowup,
    leadPushNotification,
    crmWebhookExport,
    crmDirectPush,
    crmTokenRefresh,
    inboundSmsNotification,
  ],
});
