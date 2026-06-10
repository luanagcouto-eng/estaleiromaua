import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TeamMemberCard, { type TeamMemberData, type TeamGoalData } from "./_components/team-member-card";
import TeamComparisonTable from "./_components/team-comparison-table";
import TeamPrintButton from "./_components/team-print-button";

export const metadata = { title: "Minha Equipe — Metas Mauá 2026" };

interface SubordinateRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  department: { name: string } | null;
}

interface GoalRow {
  id: string;
  title: string;
  period: string;
  weight: number;
  target_value: number;
  current_value: number;
  unit: string;
  operator: string;
  owner_id: string;
}

export default async function TeamPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = userProfile?.role === "admin";

  // Admin: fetch all profiles except self; others: fetch direct reports only
  let subsQuery = supabase
    .from("profiles")
    .select("id, name, email, avatar_url, department:department_id(name)")
    .order("name");

  if (isAdmin) {
    subsQuery = subsQuery.neq("id", user.id);
  } else {
    subsQuery = subsQuery.eq("superior_id", user.id);
  }

  const { data: subordinates } = await subsQuery;

  const members = (subordinates ?? []) as unknown as SubordinateRow[];
  const memberIds = members.map((m) => m.id);

  const [{ data: goals }, { data: history }] = await Promise.all([
    memberIds.length
      ? supabase
          .from("goals")
          .select("id, title, period, weight, target_value, current_value, unit, operator, owner_id")
          .in("owner_id", memberIds)
          .like("period", "2026%")
          .order("period")
          .order("weight", { ascending: false })
      : Promise.resolve({ data: [] as GoalRow[] }),
    memberIds.length
      ? supabase.from("goal_history").select("goal_id")
      : Promise.resolve({ data: [] as { goal_id: string }[] }),
  ]);

  const goalRows = (goals ?? []) as GoalRow[];
  const goalsByOwner = new Map<string, GoalRow[]>();
  for (const g of goalRows) {
    const list = goalsByOwner.get(g.owner_id) ?? [];
    list.push(g);
    goalsByOwner.set(g.owner_id, list);
  }

  const goalsWithHistory = new Set((history ?? []).map((h) => h.goal_id));

  const teamData: TeamMemberData[] = members.map((m) => {
    const memberGoals = goalsByOwner.get(m.id) ?? [];
    const annualGoals = memberGoals.filter((g) => g.period === "2026-ANUAL");
    const totalWeight = annualGoals.reduce((sum, g) => sum + Number(g.weight), 0);
    const consolidatedPct = totalWeight > 0
      ? Math.round(
          annualGoals.reduce((sum, g) => {
            const pct = g.target_value > 0 ? (g.current_value / g.target_value) : 0;
            return sum + pct * Number(g.weight);
          }, 0) / totalWeight * 100
        )
      : 0;

    const goalCards: TeamGoalData[] = memberGoals.map((g) => ({
      id: g.id,
      title: g.title,
      period: g.period,
      weight: g.weight,
      target_value: g.target_value,
      current_value: g.current_value,
      unit: g.unit,
      operator: g.operator,
      has_history: goalsWithHistory.has(g.id),
    }));

    return {
      id: m.id,
      name: m.name,
      email: m.email,
      avatar_url: m.avatar_url,
      departmentName: m.department?.name ?? null,
      consolidatedPct,
      goals: goalCards,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#364B59]">Minha Equipe</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isAdmin
              ? "Visão geral de todos os colaboradores e suas metas"
              : "Acompanhe as metas e o progresso dos seus subordinados diretos"}
          </p>
        </div>
        <TeamPrintButton />
      </div>

      {teamData.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center text-muted-foreground">
          <p className="text-sm">
            {isAdmin
              ? "Nenhum colaborador cadastrado ainda."
              : "Você ainda não possui subordinados diretos cadastrados."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {teamData.length > 1 && <TeamComparisonTable members={teamData} />}
          <div className="space-y-4">
            {teamData.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
