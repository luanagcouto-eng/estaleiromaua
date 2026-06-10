import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { calcProgress } from "@/lib/utils";
import ReportsView, { type GoalReportRow } from "./_components/reports-view";

export const metadata = { title: "Relatórios — Metas Mauá 2026" };

interface GoalRow {
  id: string;
  title: string;
  period: string;
  weight: number;
  target_value: number;
  current_value: number;
  unit: string;
  operator: string;
  owner: { name: string } | null;
  department: { name: string } | null;
}

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "ceo" && profile?.role !== "admin") redirect("/dashboard");

  const [{ data: rawGoals }, { data: history }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, title, period, weight, target_value, current_value, unit, operator, owner:profiles!owner_id(name), department:departments!department_id(name)")
      .like("period", "2026%")
      .order("department_id")
      .order("weight", { ascending: false }),
    supabase.from("goal_history").select("goal_id"),
  ]);

  const goalsWithHistory = new Set((history ?? []).map((h) => h.goal_id));

  const goals = (rawGoals ?? []).map((g) => ({
    ...g,
    owner: Array.isArray(g.owner) ? (g.owner[0] ?? null) : g.owner,
    department: Array.isArray(g.department) ? (g.department[0] ?? null) : g.department,
  })) as GoalRow[];

  const rows: GoalReportRow[] = goals.map((g) => ({
    id: g.id,
    title: g.title,
    period: g.period,
    weight: Number(g.weight),
    target_value: Number(g.target_value),
    current_value: Number(g.current_value),
    unit: g.unit,
    operator: g.operator,
    owner_name: g.owner?.name ?? "—",
    department_name: g.department?.name ?? "—",
    has_history: goalsWithHistory.has(g.id),
    progress_pct: calcProgress(Number(g.current_value), Number(g.target_value)),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#364B59]">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visão consolidada de todas as metas 2026 — filtre por período ou exporte para CSV
        </p>
      </div>
      <ReportsView rows={rows} />
    </div>
  );
}
