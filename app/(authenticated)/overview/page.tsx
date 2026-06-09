import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { calcProgress } from "@/lib/utils";
import { Users, Target, TrendingUp, Flag, Info } from "lucide-react";
import OrgChart, { type OrgChartNodeData } from "./_components/org-chart";
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
    .from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "ceo" && profile?.role !== "admin") redirect("/dashboard");

  const [{ data: orgRows }, { data: companyRows }, { data: leaders }, { data: goalRows }] = await Promise.all([
    supabase.from("org_chart_progress").select("*"),
    supabase.from("company_progress").select("*"),
    supabase.from("profiles").select("id, name, department_id, role").in("role", ["ceo", "director"]),
    supabase.from("goals").select("id, title, period, target_value, current_value, department_id").like("period", "2026%"),
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

  const goalsByDept = new Map<string, { id: string; title: string; period: string; progress: number }[]>();
  for (const g of goalRows ?? []) {
    if (!g.department_id) continue;
    const list = goalsByDept.get(g.department_id) ?? [];
    list.push({
      id: g.id,
      title: g.title,
      period: g.period,
      progress: calcProgress(Number(g.current_value), Number(g.target_value)),
    });
    goalsByDept.set(g.department_id, list);
  }

  const directorByDept = new Map(
    (leaders ?? [])
      .filter((p) => p.role === "director" && p.department_id)
      .map((p) => [p.department_id as string, p.name])
  );
  const ceoProfile = (leaders ?? []).find((p) => p.role === "ceo");

  const nodes: OrgChartNodeData[] = topLevel.map((dept) => {
    const director = directorByDept.get(dept.department_id) ?? null;
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
      subDepartments: children.map((c) => ({
        id: c.department_id,
        name: c.department_name,
        progress: Number(c.progress_pct),
        sectors: (childrenByParent.get(c.department_id) ?? []).map((s) => ({
          id: s.department_id,
          name: s.department_name,
        })),
      })),
    };
  });

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
        <div className="py-8">
          <OrgChart
            ceo={{
              name: ceoProfile?.name ?? null,
              isPlaceholder: !ceoProfile,
              progress: Number(company?.progress_pct ?? 0),
              goalsCount: Number(company?.goals_count ?? 0),
              goalsCompleted: Number(company?.goals_completed ?? 0),
            }}
            nodes={nodes}
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
