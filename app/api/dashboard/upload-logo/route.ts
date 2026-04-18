import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getAuthedContractor(cookieStore: ReturnType<typeof cookies>) {
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
  if (!user) return null;

  const supabase = getAdminSupabase();
  const { data: contractor } = await supabase
    .from("contractors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return contractor ? { supabase, contractorId: contractor.id } : null;
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const auth = await getAuthedContractor(cookieStore);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = auth.supabase;
  const contractorId = auth.contractorId;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  // Validate file type
  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Use PNG, JPG, WebP, or SVG." }, { status: 400 });
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
  }

  // Upload to Supabase Storage — overwrite if exists
  const ext = file.name.split(".").pop() || "png";
  const path = `${contractorId}/logo.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("logos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
  const logoUrl = urlData.publicUrl;

  // Update contractor record
  const { error: dbErr } = await supabase
    .from("contractors")
    .update({ logo_url: logoUrl })
    .eq("id", contractorId);

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ logoUrl });
}
