import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrgChart, { type OrgChartNodeData } from "./_components/org-chart";

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

export default async function OverviewPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "ceo" && profile?.role !== "admin") redirect("/dashboard");

  const [{ data: orgRows }, { data: companyRows }, { data: leaders }] = await Promise.all([
    supabase.from("org_chart_progress").select("*"),
    supabase.from("company_progress").select("*"),
    supabase.from("profiles").select("id, name, department_id, role").in("role", ["ceo", "director"]),
  ]);

  const rows = (orgRows ?? []) as OrgChartProgressRow[];
  const company = (companyRows ?? [])[0] as { progress_pct: number; goals_count: number; goals_completed: number } | undefined;

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
      subDepartments: children.map((c) => ({
        id: c.department_id,
        name: c.department_name,
        progress: Number(c.progress_pct),
      })),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#364B59]">Visão Geral da Empresa</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Organograma de metas 2026 — clique em uma diretoria para ver detalhes
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border py-8">
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

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground px-1">
        <span className="font-medium text-text">Legenda:</span>
        <LegendSwatch color="var(--color-goal-empty)" label="0%" />
        <LegendSwatch color="var(--color-goal-low)" label="1–30%" />
        <LegendSwatch color="var(--color-goal-mid)" label="31–60%" />
        <LegendSwatch color="var(--color-goal-high)" label="61–89%" />
        <LegendSwatch color="var(--color-goal-full)" label="90–100% 🏆" />
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
