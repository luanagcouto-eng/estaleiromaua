"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteGoal } from "@/lib/actions/goals";
import { formatGoalValue, calcProgress, goalTextClass } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import GoalFormDialog from "./goal-form-dialog";
import type { GoalFormValues } from "@/lib/schemas/goal";

interface Profile   { id: string; name: string; email: string; }
interface Department { id: string; name: string; sector: string; }
interface GoalRow {
  id: string; title: string; description: string | null;
  period: string; weight: number; target_value: number;
  current_value: number; unit: string;
  owner_id: string; department_id: string;
  owner: Profile | null; department: Department | null;
}

interface Props {
  goals: GoalRow[];
  profiles: Profile[];
  departments: Department[];
}

const MOCK_GOALS: GoalRow[] = [
  {
    id: "__mock_1", title: "Receita Bruta Anual", description: null,
    period: "2026-ANUAL", weight: 40, target_value: 1200000, current_value: 480000, unit: "R$",
    owner_id: "__mock", department_id: "__mock",
    owner: { id: "__mock", name: "João da Silva", email: "" },
    department: { id: "__mock", name: "Operações Navais", sector: "" },
  },
  {
    id: "__mock_2", title: "Cumprimento de Prazo de Entrega", description: null,
    period: "2026-ANUAL", weight: 30, target_value: 95, current_value: 72, unit: "%",
    owner_id: "__mock", department_id: "__mock",
    owner: { id: "__mock", name: "Maria Souza", email: "" },
    department: { id: "__mock", name: "Engenharia Naval", sector: "" },
  },
  {
    id: "__mock_3", title: "NPS — Satisfação do Cliente", description: null,
    period: "2026-Q1", weight: 20, target_value: 80, current_value: 65, unit: "pontos",
    owner_id: "__mock", department_id: "__mock",
    owner: { id: "__mock", name: "Carlos Lima", email: "" },
    department: { id: "__mock", name: "Qualidade", sector: "" },
  },
  {
    id: "__mock_4", title: "Horas de Capacitação", description: null,
    period: "2026-Q2", weight: 10, target_value: 200, current_value: 45, unit: "horas",
    owner_id: "__mock", department_id: "__mock",
    owner: { id: "__mock", name: "Ana Pereira", email: "" },
    department: { id: "__mock", name: "Recursos Humanos", sector: "" },
  },
];

export default function GoalsTable({ goals, profiles, departments }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<(GoalFormValues & { id: string }) | null>(null);

  const isMock = goals.length === 0;
  const displayGoals = isMock ? MOCK_GOALS : goals;

  // Mapa owner_id → peso total já utilizado
  const goalsByOwner = goals.reduce<Record<string, number>>((acc, g) => {
    acc[g.owner_id] = (acc[g.owner_id] ?? 0) + Number(g.weight);
    return acc;
  }, {});

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(g: GoalRow) {
    setEditing({
      id: g.id, title: g.title,
      description: g.description ?? "",
      period: g.period as GoalFormValues["period"],
      weight: Number(g.weight),
      target_value: Number(g.target_value),
      unit: g.unit as GoalFormValues["unit"],
      owner_id: g.owner_id, department_id: g.department_id,
    });
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta meta? Esta ação não pode ser desfeita.")) return;
    const res = await deleteGoal(id);
    if (res?.error) toast.error("Erro ao excluir meta.");
    else toast.success("Meta excluída.");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isMock ? "Nenhuma meta cadastrada" : `${goals.length} meta${goals.length !== 1 ? "s" : ""} cadastrada${goals.length !== 1 ? "s" : ""}`}
        </p>
        <Button onClick={openCreate} className="bg-[#364B59] hover:bg-[#2D3F4A] text-white text-sm">
          + Nova Meta
        </Button>
      </div>

      {isMock && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Pré-visualização — os dados abaixo são apenas um exemplo. Clique em &quot;+ Nova Meta&quot; para cadastrar a primeira meta real.
        </p>
      )}

      <div className={`rounded-xl border border-border bg-white overflow-hidden${isMock ? " opacity-50 pointer-events-none select-none" : ""}`}>
        <Table>
          <TableHeader>
            <TableRow className="bg-surface">
              <TableHead>Título</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="text-center">Período</TableHead>
              <TableHead className="text-right">Meta</TableHead>
              <TableHead className="text-center">Peso</TableHead>
              <TableHead className="text-center">Progresso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayGoals.map(g => {
              const pct = calcProgress(Number(g.current_value), Number(g.target_value));
              return (
                <TableRow key={g.id} className="hover:bg-surface/50">
                  <TableCell className="font-medium max-w-[200px] truncate" title={g.title}>{g.title}</TableCell>
                  <TableCell className="text-sm">{g.owner?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{g.department?.name ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {g.period.replace("2026-", "")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {formatGoalValue(Number(g.target_value), g.unit)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs font-semibold text-[#F18213]">{g.weight}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${goalTextClass(pct)}`}>
                      {pct}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {!isMock && (
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => openEdit(g)}>Editar</Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-red-500 hover:text-red-600" onClick={() => handleDelete(g.id)}>Excluir</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <GoalFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        goal={editing}
        profiles={profiles}
        departments={departments}
        goalsByOwner={goalsByOwner}
      />
    </div>
  );
}
