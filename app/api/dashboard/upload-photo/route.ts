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

// POST — upload a project photo
export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const auth = await getAuthedContractor(cookieStore);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = auth.supabase;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const siteId = formData.get("siteId") as string | null;

  if (!file || !siteId) {
    return NextResponse.json({ error: "Missing file or siteId" }, { status: 400 });
  }

  // Verify this site belongs to the authed contractor
  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("contractor_id", auth.contractorId)
    .single();
  if (!site) {
    return NextResponse.json({ error: "Site not found or not yours" }, { status: 403 });
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

  // Append to gallery_images array (ownership already verified above)
  const { data: siteGallery } = await supabase
    .from("sites")
    .select("gallery_images")
    .eq("id", siteId)
    .eq("contractor_id", auth.contractorId)
    .single();

  const existing: string[] = siteGallery?.gallery_images || [];
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
  const cookieStore = cookies();
  const auth = await getAuthedContractor(cookieStore);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = auth.supabase;
  const { siteId, photoUrl } = await req.json();

  if (!siteId || !photoUrl) {
    return NextResponse.json({ error: "Missing siteId or photoUrl" }, { status: 400 });
  }

  // Verify ownership + get gallery
  const { data: site } = await supabase
    .from("sites")
    .select("gallery_images")
    .eq("id", siteId)
    .eq("contractor_id", auth.contractorId)
    .single();

  if (!site) {
    return NextResponse.json({ error: "Site not found or not yours" }, { status: 403 });
  }

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
