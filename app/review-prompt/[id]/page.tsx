// PWA card shown when the roofer taps the body of a review_prompt push.
// Renders customer name + draft SMS preview with Send / Edit / Skip.
// Server-fetches lead+contractor with auth; ownership-protected.

import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { buildReviewSms, firstNameOf } from "@/lib/review-sms";
import { ReviewPromptCard } from "./review-prompt-card";

export const dynamic = "force-dynamic";

export default async function ReviewPromptPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/review-prompt/${params.id}`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, google_review_url")
    .eq("user_id", user.id)
    .single();

  if (!contractor) {
    return <ErrorScreen message="Contractor profile not found." />;
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, phone, status, contractor_id")
    .eq("id", params.id)
    .single();

  if (!lead || lead.contractor_id !== contractor.id) {
    return <ErrorScreen message="Lead not found." />;
  }

  if (!lead.phone) {
    return <ErrorScreen message="This lead has no phone on file." />;
  }

  if (!contractor.google_review_url) {
    return (
      <ErrorScreen message="Set your Google review URL in Settings before sending review requests." />
    );
  }

  const { data: existing } = await supabase
    .from("review_requests")
    .select("status")
    .eq("lead_id", params.id)
    .eq("contractor_id", contractor.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return (
      <ErrorScreen message={`Already handled (${existing.status}).`} />
    );
  }

  const { body } = buildReviewSms({
    customerName: lead.name,
    businessName: contractor.business_name,
    googleReviewUrl: contractor.google_review_url,
  });

  return (
    <ReviewPromptCard
      leadId={lead.id}
      firstName={firstNameOf(lead.name)}
      phone={lead.phone}
      defaultBody={body}
    />
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#e8e8e8]">
      <div className="neu-flat rounded-2xl p-8 max-w-md text-center">
        <div className="text-lg font-medium text-zinc-800">{message}</div>
        <a
          href="/dashboard"
          className="mt-6 inline-block text-sm text-zinc-600 underline"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
