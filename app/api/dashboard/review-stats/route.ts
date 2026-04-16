// Review stats API — analytics for the reviews dashboard + Copilot tools.
// Returns: sent/clicked/reviewed counts, conversion rates, recent requests, unrequested jobs.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch { /* read-only */ }
          },
        },
      }
    );

    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: contractor } = await supabase
      .from("contractors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    const contractorId = contractor.id;

    // Fetch all review requests with lead names
    const { data: requests } = await supabase
      .from("review_requests")
      .select("id, status, sent_at, clicked_at, reviewed_at, created_at, lead_id, leads(name, email)")
      .eq("contractor_id", contractorId)
      .order("created_at", { ascending: false });

    const allRequests = requests || [];

    // Calculate stats
    const sent = allRequests.filter(r => r.status !== "pending");
    const clicked = allRequests.filter(r => r.clicked_at);
    const reviewed = allRequests.filter(r => r.status === "reviewed");

    // This month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthSent = sent.filter(r => new Date(r.created_at) >= monthStart);
    const thisMonthClicked = clicked.filter(r => new Date(r.created_at) >= monthStart);
    const thisMonthReviewed = reviewed.filter(r => new Date(r.created_at) >= monthStart);

    const lastMonthSent = sent.filter(r => {
      const d = new Date(r.created_at);
      return d >= lastMonthStart && d < monthStart;
    });
    const lastMonthClicked = clicked.filter(r => {
      const d = new Date(r.created_at);
      return d >= lastMonthStart && d < monthStart;
    });
    const lastMonthReviewed = reviewed.filter(r => {
      const d = new Date(r.created_at);
      return d >= lastMonthStart && d < monthStart;
    });

    // Recent requests (last 10)
    const recent = allRequests.slice(0, 10).map(r => {
      const lead = r.leads as any;
      return {
        id: r.id,
        lead_name: lead?.name || "Unknown",
        lead_email: lead?.email || null,
        status: r.status,
        sent_at: r.sent_at,
        clicked_at: r.clicked_at,
        created_at: r.created_at,
      };
    });

    // Count completed/won leads with no review request
    const { data: completedLeads } = await supabase
      .from("leads")
      .select("id")
      .eq("contractor_id", contractorId)
      .in("status", ["completed", "won"]);

    const completedIds = (completedLeads || []).map(l => l.id);
    const requestedLeadIds = new Set(allRequests.map(r => r.lead_id));
    const unrequestedCount = completedIds.filter(id => !requestedLeadIds.has(id)).length;

    return NextResponse.json({
      total_sent: sent.length,
      total_clicked: clicked.length,
      total_reviewed: reviewed.length,
      click_rate: sent.length > 0 ? Math.round((clicked.length / sent.length) * 100) : 0,
      review_rate: sent.length > 0 ? Math.round((reviewed.length / sent.length) * 100) : 0,
      this_month: {
        sent: thisMonthSent.length,
        clicked: thisMonthClicked.length,
        reviewed: thisMonthReviewed.length,
      },
      last_month: {
        sent: lastMonthSent.length,
        clicked: lastMonthClicked.length,
        reviewed: lastMonthReviewed.length,
      },
      recent_requests: recent,
      unrequested_completed: unrequestedCount,
    });
  } catch (err) {
    console.error("Review stats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
