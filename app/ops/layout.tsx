import { redirect } from "next/navigation";
import { createAuthSupabase } from "@/lib/supabase-server";
import OpsShell from "./components/OpsShell";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth gate — blocks before any HTML is sent
  try {
    const supabase = createAuthSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user?.email) {
      redirect("/login");
    }

    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(user.email)) {
      redirect("/login");
    }
  } catch {
    redirect("/login");
  }

  return <OpsShell>{children}</OpsShell>;
}
