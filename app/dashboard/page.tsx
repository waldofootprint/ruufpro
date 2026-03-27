// Dashboard home — redirects to leads page.

import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/dashboard/leads");
}
