import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// POST — upload a project photo
export async function POST(req: NextRequest) {
  const supabase = getAdminSupabase();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const siteId = formData.get("siteId") as string | null;

  if (!file || !siteId) {
    return NextResponse.json({ error: "Missing file or siteId" }, { status: 400 });
  }

  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Use PNG, JPG, or WebP." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
  }

  // Unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${siteId}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("photos")
    .upload(path, file, { contentType: file.type });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
  const photoUrl = urlData.publicUrl;

  // Append to gallery_images array
  const { data: site } = await supabase
    .from("sites")
    .select("gallery_images")
    .eq("id", siteId)
    .single();

  const existing: string[] = site?.gallery_images || [];
  const { error: dbErr } = await supabase
    .from("sites")
    .update({ gallery_images: [...existing, photoUrl] })
    .eq("id", siteId);

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json({ photoUrl, gallery: [...existing, photoUrl] });
}

// DELETE — remove a photo from gallery
export async function DELETE(req: NextRequest) {
  const supabase = getAdminSupabase();
  const { siteId, photoUrl } = await req.json();

  if (!siteId || !photoUrl) {
    return NextResponse.json({ error: "Missing siteId or photoUrl" }, { status: 400 });
  }

  // Remove from gallery array
  const { data: site } = await supabase
    .from("sites")
    .select("gallery_images")
    .eq("id", siteId)
    .single();

  const updated = (site?.gallery_images || []).filter((url: string) => url !== photoUrl);
  const { error: dbErr } = await supabase
    .from("sites")
    .update({ gallery_images: updated })
    .eq("id", siteId);

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  // Delete from storage
  const storagePath = photoUrl.split("/photos/")[1];
  if (storagePath) {
    await supabase.storage.from("photos").remove([storagePath]);
  }

  return NextResponse.json({ gallery: updated });
}
