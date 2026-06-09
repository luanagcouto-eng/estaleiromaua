import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { calcProgress } from "@/lib/utils";
import type { GoalCardData } from "./_components/goal-card";
import type { GoalHistoryEntry } from "./_components/goal-history-list";
import GoalsExecutiveTable from "./_components/goals-executive-table";
import GoalAlertsPanel, { type GoalAlert } from "@/components/alerts/goal-alerts-panel";

export const metadata = { title: "Atualização de Metas — Metas Mauá 2026" };

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

export default async function MyGoalsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const userName = profile?.name ?? user.email ?? "Usuário";

  // Goals — sem join para evitar duplicação de linhas
  let goalsQuery = supabase
    .from("goals")
    .select("id, title, description, period, weight, sub_weight, target_value, current_value, unit, operator, owner_id")
    .like("period", "2026%")
    .order("period")
    .order("weight", { ascending: false });

  if (!isAdmin) {
    goalsQuery = goalsQuery.eq("owner_id", user.id);
  }

  const { data: goals } = await goalsQuery;
  const rows = (goals ?? []) as GoalRow[];

  // Para admin: buscar nomes dos responsáveis em query separada
  const ownerNameMap = new Map<string, string>();
  if (isAdmin) {
    const { data: profiles } = await supabase.from("profiles").select("id, name");
    for (const p of profiles ?? []) ownerNameMap.set(p.id, p.name);
  }

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
    ownerName: isAdmin ? (ownerNameMap.get(g.owner_id) ?? undefined) : undefined,
    history: historyByGoal.get(g.id) ?? [],
  }));

  // Alertas — somente para o próprio usuário
  const alerts: GoalAlert[] = [];
  if (!isAdmin) {
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
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#364B59]">Atualização de Metas</h1>
        <p className="text-[#364B59] text-sm font-medium mt-0.5">
          {isAdmin ? "Todos os Colaboradores" : userName}
        </p>
        <p className="text-muted-foreground text-xs mt-0.5">
          {isAdmin
            ? "Visualize e lance resultados para qualquer meta da organização"
            : "Registre resultados e anexe evidências/memória de cálculo para cada meta"}
        </p>
      </div>

      {!isAdmin && <GoalAlertsPanel alerts={alerts} />}

      {goalCards.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center text-muted-foreground">
          <p className="text-sm">
            {isAdmin
              ? "Nenhuma meta cadastrada na organização ainda."
              : "Nenhuma meta atribuída a você ainda. Procure seu gestor ou o time de Admin."}
          </p>
        </div>
      ) : (
        <GoalsExecutiveTable goals={goalCards} />
      )}
    </div>
  );
}
