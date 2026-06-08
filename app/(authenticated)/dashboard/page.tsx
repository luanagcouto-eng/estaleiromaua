import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  switch (profile?.role) {
    case "ceo":
      redirect("/overview");
    case "director":
    case "manager":
      redirect("/my-goals");
    case "admin":
      redirect("/admin/users");
    default:
      redirect("/my-goals");
  }
}
