import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const supabase = getAdminSupabase();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const contractorId = formData.get("contractorId") as string | null;

  if (!file || !contractorId) {
    return NextResponse.json({ error: "Missing file or contractorId" }, { status: 400 });
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
