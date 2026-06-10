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

  const [{ data: rawProfiles }, { data: departments }, { data: profileDepts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, role, department_id, superior_id, is_placeholder, avatar_url")
      .order("name"),
    supabase
      .from("departments")
      .select("id, name, sector")
      .order("name"),
    supabase
      .from("profile_departments")
      .select("profile_id, department_id"),
  ]);

  const profileMap = new Map((rawProfiles ?? []).map((p) => [p.id, p]));
  const deptMap    = new Map((departments  ?? []).map((d) => [d.id, d]));

  // Build department_ids per profile from junction table, fallback to department_id column
  const deptsByProfile = new Map<string, string[]>();
  for (const pd of profileDepts ?? []) {
    const list = deptsByProfile.get(pd.profile_id) ?? [];
    list.push(pd.department_id);
    deptsByProfile.set(pd.profile_id, list);
  }

  const users = (rawProfiles ?? []).map((p) => ({
    ...p,
    department_ids: deptsByProfile.get(p.id) ?? (p.department_id ? [p.department_id] : []),
    department: p.department_id ? (deptMap.get(p.department_id) ?? null) : null,
    superior:   p.superior_id   ? (profileMap.get(p.superior_id) ?? null) : null,
  }));

  const allProfiles = users.map((u) => ({ id: u.id, name: u.name, email: u.email }));

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
