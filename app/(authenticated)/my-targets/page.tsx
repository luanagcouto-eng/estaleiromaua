import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { calcProgress } from "@/lib/utils";
import type { GoalCardData } from "../my-goals/_components/goal-card";
import type { GoalHistoryEntry } from "../my-goals/_components/goal-history-list";
import GoalsExecutiveTable from "../my-goals/_components/goals-executive-table";
import GoalAlertsPanel, { type GoalAlert } from "@/components/alerts/goal-alerts-panel";

export const metadata = { title: "Minhas Metas — Metas Mauá 2026" };

interface GoalRow {
  id: string;
  title: string;
  description: string | null;
  period: string;
  weight: number;
  target_value: number;
  current_value: number;
  unit: string;
  operator: string;
  sub_weight: number | null;
  owner_id: string;
}

export default async function MyTargetsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const userName = profile?.name ?? user.email ?? "Usuário";

  // Sempre filtra pelas metas do próprio usuário, independente do role
  const { data: goals } = await supabase
    .from("goals")
    .select("id, title, description, period, weight, sub_weight, target_value, current_value, unit, operator, owner_id")
    .eq("owner_id", user.id)
    .like("period", "2026%")
    .order("period")
    .order("weight", { ascending: false });

  const rows = (goals ?? []) as GoalRow[];
  const goalIds = rows.map((g) => g.id);

  const { data: history } = goalIds.length
    ? await supabase
        .from("goal_history")
        .select("id, goal_id, value, period, notes, data_source, criteria, formula_used, justification, five_whys, action_plan, evidence_url, recorded_at")
        .in("goal_id", goalIds)
        .order("recorded_at", { ascending: false })
    : { data: [] as (GoalHistoryEntry & { goal_id: string })[] };

  const historyByGoal = new Map<string, GoalHistoryEntry[]>();
  for (const entry of history ?? []) {
    const list = historyByGoal.get(entry.goal_id) ?? [];
    list.push(entry);
    historyByGoal.set(entry.goal_id, list);
  }

  const goalCards: GoalCardData[] = rows.map((g) => ({
    ...g,
    history: historyByGoal.get(g.id) ?? [],
  }));

  // Alertas
  const alerts: GoalAlert[] = [];
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter =
    currentMonth <= 3 ? "2026-Q1" :
    currentMonth <= 6 ? "2026-Q2" :
    currentMonth <= 9 ? "2026-Q3" : "2026-Q4";

  const goalsWithHistory = new Set((history ?? []).map((e) => e.goal_id));

  for (const g of rows) {
    const hasHistory = goalsWithHistory.has(g.id);
    const pct = calcProgress(Number(g.current_value), Number(g.target_value));

    if (!hasHistory && g.period !== currentQuarter) {
      alerts.push({ type: "no-history", title: g.title, period: g.period });
    } else if (!hasHistory && g.period === currentQuarter) {
      alerts.push({ type: "quarter-pending", title: g.title, period: g.period });
    } else if (g.period === "2026-ANUAL" && pct < 50) {
      alerts.push({ type: "at-risk", title: g.title, period: g.period, progress: pct });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#364B59]">Minhas Metas</h1>
        <p className="text-[#364B59] text-sm font-medium mt-0.5">{userName}</p>
        <p className="text-muted-foreground text-xs mt-0.5">
          Acompanhe o andamento das metas que são de sua responsabilidade
        </p>
      </div>

      <GoalAlertsPanel alerts={alerts} />

      {goalCards.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center text-muted-foreground">
          <p className="text-sm">Nenhuma meta atribuída a você ainda. Procure seu gestor ou o time de Admin.</p>
        </div>
      ) : (
        <GoalsExecutiveTable goals={goalCards} />
      )}
    </div>
  );
}
