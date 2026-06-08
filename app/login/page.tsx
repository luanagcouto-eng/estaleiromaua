import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginCard from "@/components/auth/login-card";

export const metadata = {
  title: "Login — Metas Mauá 2026",
};

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return <LoginCard />;
}
