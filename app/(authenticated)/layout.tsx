import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppSidebar from "@/components/layout/app-sidebar";
import PrintElements from "@/components/layout/print-elements";
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
      {/* Skip navigation — acessibilidade */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[#364B59] focus:px-4 focus:py-2 focus:text-white focus:text-sm focus:font-medium"
      >
        Ir para o conteúdo principal
      </a>

      <AppSidebar
        name={profile.name}
        email={profile.email}
        role={profile.role as UserRole}
        avatarUrl={profile.avatar_url}
      />
      <main id="main-content" className="flex-1 ml-0 md:ml-64 min-h-screen pt-14 md:pt-0" tabIndex={-1}>
        <PrintElements />
        <div className="p-4 md:p-8 print-content">{children}</div>
      </main>
    </div>
  );
}
