import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { calcProgress } from "@/lib/utils";
import { Users, Target, TrendingUp, Flag, Info } from "lucide-react";
import { type OrgChartNodeData, type GoalItem } from "./_components/org-chart";
import OrgChartSection from "./_components/org-chart-section";
import { type ActionPlanItem } from "./_components/action-plans-section";
import OrgChartFooter from "./_components/org-chart-footer";
import type { ReactNode } from "react";

export const metadata = { title: "Visão Geral — Metas Mauá 2026" };

interface OrgChartProgressRow {
  department_id: string;
  department_name: string;
  sector: string;
  parent_id: string | null;
  progress_pct: number;
  goals_count: number;
  goals_completed: number;
}

// ── KPI card ──────────────────────────────────────────────────────
function KpiCard({
  icon,
  value,
  label,
  sublabel,
  accent,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  sublabel: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex items-start gap-4">
      <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p
          className="text-2xl font-black tabular-nums leading-none"
          style={{ color: accent ?? "#364B59" }}
        >
          {value}
        </p>
        <p className="text-sm font-semibold text-[#364B59] mt-0.5 leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}

// ── Legend swatch ─────────────────────────────────────────────────
function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export default async function OverviewPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, department_id").eq("id", user.id).single();

  const role = profile?.role;
  if (role !== "ceo" && role !== "admin" && role !== "director") redirect("/dashboard");

  const [{ data: orgRows }, { data: companyRows }, { data: allProfiles }, { data: goalRows }, { data: actionPlanRows }] = await Promise.all([
    supabase.from("org_chart_progress").select("*"),
    supabase.from("company_progress").select("*"),
    supabase.from("profiles").select("id, name, department_id, role"),
    supabase.from("goals").select("id, title, period, target_value, current_value, unit, operator, department_id").like("period", "2026%"),
    supabase.from("goal_history").select("id, goal_id, period, action_plan, recorded_at").not("action_plan", "is", null),
  ]);

  const rows = (orgRows ?? []) as OrgChartProgressRow[];
  const company = (companyRows ?? [])[0] as {
    progress_pct: number;
    goals_count: number;
    goals_completed: number;
  } | undefined;

  const topLevel = rows
    .filter((r) => r.parent_id === null)
    .sort((a, b) => a.department_name.localeCompare(b.department_name));

  const childrenByParent = new Map<string, OrgChartProgressRow[]>();
  for (const row of rows) {
    if (!row.parent_id) continue;
    const list = childrenByParent.get(row.parent_id) ?? [];
    list.push(row);
    childrenByParent.set(row.parent_id, list);
  }

  const goalsByDept = new Map<string, GoalItem[]>();
  for (const g of goalRows ?? []) {
    if (!g.department_id) continue;
    const list = goalsByDept.get(g.department_id) ?? [];
    list.push({
      id: g.id,
      title: g.title,
      period: g.period,
      progress: calcProgress(Number(g.current_value), Number(g.target_value)),
      current_value: Number(g.current_value),
      target_value: Number(g.target_value),
      unit: g.unit,
      operator: g.operator,
    });
    goalsByDept.set(g.department_id, list);
  }

  // Mapeia o responsável (qualquer role) atribuído a cada departamento via "Usuários"
  const ROLE_PRIORITY: Record<string, number> = { director: 0, manager: 1, admin: 2, ceo: 3 };
  const responsibleByDept = new Map<string, string>();
  for (const p of [...(allProfiles ?? [])].sort(
    (a, b) => (ROLE_PRIORITY[a.role] ?? 9) - (ROLE_PRIORITY[b.role] ?? 9)
  )) {
    if (p.department_id && !responsibleByDept.has(p.department_id)) {
      responsibleByDept.set(p.department_id, p.name);
    }
  }
  const ceoProfile = (allProfiles ?? []).find((p) => p.role === "ceo");

  const nodes: OrgChartNodeData[] = topLevel.map((dept) => {
    const director = responsibleByDept.get(dept.department_id) ?? null;
    const children = (childrenByParent.get(dept.department_id) ?? [])
      .sort((a, b) => a.department_name.localeCompare(b.department_name));

    return {
      id: dept.department_id,
      name: dept.department_name,
      director,
      isPlaceholder: !director,
      progress: Number(dept.progress_pct),
      goalsCount: Number(dept.goals_count),
      goalsCompleted: Number(dept.goals_completed),
      goals: goalsByDept.get(dept.department_id) ?? [],
      subDepartments: children.map((c) => {
        const subDirector = responsibleByDept.get(c.department_id) ?? null;
        return {
          id: c.department_id,
          name: c.department_name,
          director: subDirector,
          isPlaceholder: !subDirector,
          progress: Number(c.progress_pct),
          goalsCount: Number(c.goals_count),
          goalsCompleted: Number(c.goals_completed),
          goals: goalsByDept.get(c.department_id) ?? [],
          sectors: (childrenByParent.get(c.department_id) ?? []).map((s) => ({
            id: s.department_id,
            name: s.department_name,
            responsible: responsibleByDept.get(s.department_id) ?? null,
            progress: Number(s.progress_pct),
          })),
        };
      }),
    };
  });

  // Departamento (diretoria) do usuário atual, usado como escopo padrão para Diretores
  const deptById = new Map(rows.map((r) => [r.department_id, r]));
  function findDirectorateId(deptId: string | null): string | null {
    let current = deptId ? deptById.get(deptId) : undefined;
    while (current?.parent_id) {
      current = deptById.get(current.parent_id);
    }
    return current?.department_id ?? null;
  }
  const myDirectorateId = role === "director" ? findDirectorateId(profile?.department_id ?? null) : null;
  const directorateOptions = topLevel.map((d) => ({ id: d.department_id, name: d.department_name }));

  // Planos de ação em andamento: última entrada com action_plan por meta, para metas ainda não atingidas
  const goalsById = new Map((goalRows ?? []).map((g) => [g.id, g]));
  const latestActionPlanByGoal = new Map<string, { id: string; period: string | null; action_plan: string; recorded_at: string }>();
  for (const row of actionPlanRows ?? []) {
    const plan = row.action_plan?.trim();
    if (!plan) continue;
    const existing = latestActionPlanByGoal.get(row.goal_id);
    if (!existing || new Date(row.recorded_at) > new Date(existing.recorded_at)) {
      latestActionPlanByGoal.set(row.goal_id, { id: row.id, period: row.period, action_plan: plan, recorded_at: row.recorded_at });
    }
  }

  const actionPlans: ActionPlanItem[] = [];
  for (const [goalId, entry] of latestActionPlanByGoal) {
    const goal = goalsById.get(goalId);
    if (!goal) continue;
    const progress = calcProgress(Number(goal.current_value), Number(goal.target_value));
    if (progress >= 100) continue;
    actionPlans.push({
      id: entry.id,
      goalId,
      goalTitle: goal.title,
      directorateId: findDirectorateId(goal.department_id),
      period: entry.period,
      actionPlan: entry.action_plan,
      progress,
      currentValue: Number(goal.current_value),
      targetValue: Number(goal.target_value),
      unit: goal.unit,
      operator: goal.operator,
    });
  }

  const avgProgress = Number(company?.progress_pct ?? 0);
  const progressAccent = avgProgress >= 66 ? "#22c55e" : avgProgress >= 33 ? "#F18213" : "#ef4444";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#364B59]">Visão Geral da Empresa</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Organograma de metas 2026 — clique em uma diretoria para ver detalhes
        </p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="w-5 h-5" />}
          value={String(nodes.length)}
          label="Diretorias"
          sublabel="Estrutura organizacional"
        />
        <KpiCard
          icon={<Target className="w-5 h-5" />}
          value={String(company?.goals_count ?? 0)}
          label="Metas ativas"
          sublabel="Total de metas cadastradas"
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          value={`${avgProgress.toFixed(0)}%`}
          label="Progresso médio"
          sublabel="Média geral atingida"
          accent={progressAccent}
        />
        <KpiCard
          icon={<Flag className="w-5 h-5" />}
          value="66%"
          label="Meta esperada"
          sublabel="Média esperada para o período"
          accent="#F18213"
        />
      </div>

      {/* Org chart + footer in unified white container */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="py-8 bg-white">
          <OrgChartSection
            ceo={{
              name: ceoProfile?.name ?? null,
              isPlaceholder: !ceoProfile,
              progress: Number(company?.progress_pct ?? 0),
              goalsCount: Number(company?.goals_count ?? 0),
              goalsCompleted: Number(company?.goals_completed ?? 0),
            }}
            nodes={nodes}
            directorateOptions={directorateOptions}
            canCustomize={role === "admin" || role === "director"}
            defaultScopeId={myDirectorateId}
            actionPlans={actionPlans}
          />
        </div>

        {/* Container footer: legend + info + last update */}
        <div className="px-8 pb-6 border-t border-border">
          <div className="flex items-start justify-between gap-6 pt-5">
            {/* Legend */}
            <div>
              <p className="text-xs font-semibold text-[#364B59] mb-2">Legenda de progresso</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <LegendSwatch color="#DFA1AA" label="0% – 33%" />
                <LegendSwatch color="#F9E79F" label="33% – 66%" />
                <LegendSwatch color="#9AD595" label="66% – 100%" />
              </div>
            </div>

            {/* Info card */}
            <div className="flex items-start gap-3 bg-surface border border-border rounded-xl px-4 py-3 max-w-sm">
              <Info className="w-4 h-4 text-[#364B59]/50 shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-xs font-semibold text-[#364B59] leading-snug">
                  Clique em uma diretoria para visualizar as metas, responsáveis e iniciativas.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Acompanhe o desempenho e foque nas prioridades para alcançar os resultados esperados.
                </p>
              </div>
            </div>
          </div>

          {/* Last update + refresh */}
          <OrgChartFooter />
        </div>
      </div>
    </div>
  );
}
