import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GoalsTable from "../_components/goals-table";

export const metadata = { title: "Configurar Metas — Metas Mauá 2026" };

export default async function AdminGoalsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin" && profile?.role !== "ceo") redirect("/dashboard");

  const [{ data: goals }, { data: profiles }, { data: departments }, { data: historyRows }] = await Promise.all([
    supabase
      .from("goals")
      .select("*, owner:profiles(id,name,email), department:departments(id,name,sector)")
      .order("owner_id").order("weight", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, name, email")
      .order("name"),
    supabase
      .from("departments")
      .select("id, name, sector, parent_id")
      .order("name"),
    supabase.from("goal_history").select("goal_id"),
  ]);

  const goalsWithHistory = new Set((historyRows ?? []).map((h) => h.goal_id));
  const goalsWithHasHistory = (goals ?? []).map((g) => ({ ...g, has_history: goalsWithHistory.has(g.id) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#364B59]">Configuração de Metas</h1>
        <p className="text-muted-foreground text-sm mt-1">Crie e edite as metas anuais por gestor — peso total deve somar 100%</p>
      </div>
      <GoalsTable
        goals={goalsWithHasHistory}
        profiles={profiles ?? []}
        departments={departments ?? []}
      />
    </div>
  );
}
