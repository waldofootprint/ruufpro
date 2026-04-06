import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  leadAutoResponse,
  missedCallTextback,
  reviewRequest,
  reviewEmailFollowup,
  leadPushNotification,
} from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    leadAutoResponse,
    missedCallTextback,
    reviewRequest,
    reviewEmailFollowup,
    leadPushNotification,
  ],
});
