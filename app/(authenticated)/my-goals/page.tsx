import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { goalTextClass, calcProgress } from "@/lib/utils";
import GoalCard, { type GoalCardData } from "./_components/goal-card";
import type { GoalHistoryEntry } from "./_components/goal-history-list";
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
}

export default async function MyGoalsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goals } = await supabase
    .from("goals")
    .select("id, title, description, period, weight, target_value, current_value, unit")
    .eq("owner_id", user.id)
    .like("period", "2026%")
    .order("period")
    .order("weight", { ascending: false });

  const rows = (goals ?? []) as GoalRow[];
  const goalIds = rows.map((g) => g.id);

  const { data: history } = goalIds.length
    ? await supabase
        .from("goal_history")
        .select("id, goal_id, value, notes, evidence_url, recorded_at")
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

  const annualGoals = rows.filter((g) => g.period === "2026-ANUAL");
  const totalWeight = annualGoals.reduce((sum, g) => sum + Number(g.weight), 0);
  const consolidatedPct = totalWeight > 0
    ? Math.round(
        annualGoals.reduce((sum, g) => {
          const pct = g.target_value > 0 ? (g.current_value / g.target_value) : 0;
          return sum + pct * Number(g.weight);
        }, 0) / totalWeight * 100
      )
    : 0;

  // Alertas: determina trimestre atual e computa os 3 tipos de alerta
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter =
    currentMonth <= 3 ? "2026-Q1" :
    currentMonth <= 6 ? "2026-Q2" :
    currentMonth <= 9 ? "2026-Q3" : "2026-Q4";

  const goalsWithHistory = new Set(
    (history ?? []).map((e) => e.goal_id)
  );

  const alerts: GoalAlert[] = [];
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#364B59]">Minhas Metas</h1>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe suas metas de 2026 e registre seus resultados</p>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Progresso consolidado 2026 (metas anuais)</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {annualGoals.length} meta{annualGoals.length !== 1 ? "s" : ""} · peso total {totalWeight.toFixed(1)}%
            </p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${goalTextClass(consolidatedPct)}`}>
            {consolidatedPct}% {consolidatedPct >= 90 ? "🏆" : ""}
          </span>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-surface overflow-hidden border border-border">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, consolidatedPct)}%`, backgroundColor: "#F18213" }}
          />
        </div>
      </div>

      <GoalAlertsPanel alerts={alerts} />

      {goalCards.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center text-muted-foreground">
          <p className="text-sm">Nenhuma meta atribuída a você ainda. Procure seu gestor ou o time de Admin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goalCards.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
