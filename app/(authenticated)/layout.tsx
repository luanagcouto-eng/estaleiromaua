import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppSidebar from "@/components/layout/app-sidebar";
import type { UserRole } from "@/types";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen bg-surface">
      <AppSidebar
        name={profile.name}
        email={profile.email}
        role={profile.role as UserRole}
        avatarUrl={profile.avatar_url}
      />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
