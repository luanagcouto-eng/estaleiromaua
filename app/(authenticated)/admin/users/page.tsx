import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UsersTable from "../_components/users-table";

export const metadata = { title: "Usuários — Metas Mauá 2026" };

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin" && profile?.role !== "ceo") redirect("/dashboard");

  const [{ data: rawUsers }, { data: departments }] = await Promise.all([
    supabase
      .from("profiles")
      .select(`
        id, name, email, role, department_id, superior_id,
        department:departments(id,name,sector),
        superior:profiles!superior_id(id,name,email)
      `)
      .order("name"),
    supabase
      .from("departments")
      .select("id, name, sector")
      .order("name"),
  ]);

  // Supabase retorna relações como array — normaliza para objeto único
  const users = (rawUsers ?? []).map((u) => ({
    ...u,
    department: Array.isArray(u.department) ? (u.department[0] ?? null) : u.department,
    superior:   Array.isArray(u.superior)   ? (u.superior[0]   ?? null) : u.superior,
  }));

  const allProfiles = users.map(u => ({ id: u.id, name: u.name, email: u.email }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#364B59]">Gestão de Usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Atribua roles, departamentos e superiores. Novos usuários aparecem aqui após o primeiro login.
        </p>
      </div>
      <UsersTable
        users={users}
        departments={departments ?? []}
        allProfiles={allProfiles}
      />
    </div>
  );
}
