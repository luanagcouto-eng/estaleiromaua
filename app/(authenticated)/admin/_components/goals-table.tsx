"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteGoal } from "@/lib/actions/goals";
import { formatGoalValue, calcProgress, goalTextClass, OP_SYMBOL, labelFromOptions } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GoalFormDialog from "./goal-form-dialog";
import type { GoalFormValues } from "@/lib/schemas/goal";

interface Profile   { id: string; name: string; email: string; }
interface Department { id: string; name: string; sector: string; parent_id: string | null; }

interface GoalRow {
  id: string; title: string; description: string | null;
  period: string; weight: number; sub_weight: number | null; target_value: number;
  current_value: number; unit: string; operator: string;
  owner_id: string; department_id: string;
  owner: Profile | null; department: Pick<Department, "id" | "name" | "sector"> | null;
  has_history: boolean;
}

interface Props {
  goals: GoalRow[];
  profiles: Profile[];
  departments: Department[];
}

type SortCol = "title" | "owner" | "department" | "period" | "target_value" | "weight" | "progress";

const MOCK_GOALS: GoalRow[] = [
  {
    id: "__mock_1", title: "Receita Bruta Anual", description: null,
    period: "2026-ANUAL", weight: 40, target_value: 1200000, current_value: 480000, unit: "R$", operator: ">=", sub_weight: null,
    owner_id: "__mock", department_id: "__mock", has_history: true,
    owner: { id: "__mock", name: "João da Silva", email: "" },
    department: { id: "__mock", name: "Operações Navais", sector: "" },
  },
  {
    id: "__mock_2", title: "Cumprimento de Prazo de Entrega", description: null,
    period: "2026-ANUAL", weight: 30, target_value: 95, current_value: 72, unit: "%", operator: ">=", sub_weight: null,
    owner_id: "__mock", department_id: "__mock", has_history: true,
    owner: { id: "__mock", name: "Maria Souza", email: "" },
    department: { id: "__mock", name: "Engenharia Naval", sector: "" },
  },
  {
    id: "__mock_3", title: "NPS — Satisfação do Cliente", description: null,
    period: "2026-Q1", weight: 20, target_value: 80, current_value: 65, unit: "pontos", operator: ">=", sub_weight: null,
    owner_id: "__mock", department_id: "__mock", has_history: true,
    owner: { id: "__mock", name: "Carlos Lima", email: "" },
    department: { id: "__mock", name: "Qualidade", sector: "" },
  },
  {
    id: "__mock_4", title: "Horas de Capacitação", description: null,
    period: "2026-Q2", weight: 10, target_value: 200, current_value: 45, unit: "horas", operator: ">=", sub_weight: null,
    owner_id: "__mock", department_id: "__mock", has_history: true,
    owner: { id: "__mock", name: "Ana Pereira", email: "" },
    department: { id: "__mock", name: "Recursos Humanos", sector: "" },
  },
];

function SortArrow({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol | null; sortDir: "asc" | "desc" }) {
  if (sortCol !== col) return <span className="ml-1 text-slate-300 text-xs">↕</span>;
  return <span className="ml-1 text-[#F18213] text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

export default function GoalsTable({ goals, profiles, departments }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<(GoalFormValues & { id: string }) | null>(null);

  // Filters
  const [filterTitle, setFilterTitle]   = useState("");
  const [filterOwner, setFilterOwner]   = useState("all");

  // Sort
  const [sortCol, setSortCol]   = useState<SortCol | null>(null);
  const [sortDir, setSortDir]   = useState<"asc" | "desc">("asc");

  const isMock = goals.length === 0;
  const deptMap = new Map(departments.map(d => [d.id, d]));

  const goalsByOwner = goals.reduce<Record<string, number>>((acc, g) => {
    acc[g.owner_id] = (acc[g.owner_id] ?? 0) + Number(g.weight);
    return acc;
  }, {});

  const uniqueOwners = useMemo(() => {
    const seen = new Set<string>();
    return goals
      .filter(g => g.owner && !seen.has(g.owner_id) && seen.add(g.owner_id))
      .map(g => ({ id: g.owner_id, name: g.owner!.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [goals]);

  const processedGoals = useMemo(() => {
    let data = isMock ? MOCK_GOALS : goals;

    if (!isMock) {
      if (filterTitle) {
        data = data.filter(g => g.title.toLowerCase().includes(filterTitle.toLowerCase()));
      }
      if (filterOwner !== "all") {
        data = data.filter(g => g.owner_id === filterOwner);
      }
    }

    if (!isMock && sortCol) {
      data = [...data].sort((a, b) => {
        let aVal: string | number = "";
        let bVal: string | number = "";
        switch (sortCol) {
          case "title":
            aVal = a.title; bVal = b.title; break;
          case "owner":
            aVal = a.owner?.name ?? ""; bVal = b.owner?.name ?? ""; break;
          case "department": {
            const aDept = deptMap.get(a.department_id);
            const bDept = deptMap.get(b.department_id);
            const aParent = aDept?.parent_id ? deptMap.get(aDept.parent_id) : null;
            const bParent = bDept?.parent_id ? deptMap.get(bDept.parent_id) : null;
            aVal = aDept ? (aParent ? `${aParent.name} ${aDept.name}` : aDept.name) : "";
            bVal = bDept ? (bParent ? `${bParent.name} ${bDept.name}` : bDept.name) : "";
            break;
          }
          case "period":
            aVal = a.period; bVal = b.period; break;
          case "target_value":
            aVal = Number(a.target_value); bVal = Number(b.target_value); break;
          case "weight":
            aVal = Number(a.weight); bVal = Number(b.weight); break;
          case "progress":
            aVal = calcProgress(Number(a.current_value), Number(a.target_value), a.operator, a.has_history);
            bVal = calcProgress(Number(b.current_value), Number(b.target_value), b.operator, b.has_history);
            break;
        }
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [goals, isMock, filterTitle, filterOwner, sortCol, sortDir, deptMap]);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  function openCreate() { setEditing(null); setDialogOpen(true); }
  function openEdit(g: GoalRow) {
    setEditing({
      id: g.id, title: g.title,
      description: g.description ?? "",
      period: g.period as GoalFormValues["period"],
      weight: Number(g.weight),
      target_value: Number(g.target_value),
      unit: g.unit as GoalFormValues["unit"],
      operator: (g.operator ?? ">=") as GoalFormValues["operator"],
      sub_weight: g.sub_weight ?? null,
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

  const hasActiveFilters = filterTitle !== "" || filterOwner !== "all";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Buscar por título..."
            value={filterTitle}
            onChange={(e) => setFilterTitle(e.target.value)}
            className="h-8 text-sm w-[200px] bg-white"
          />
          <Select value={filterOwner} onValueChange={(v) => setFilterOwner(v ?? "all")}>
            <SelectTrigger className="h-8 text-sm w-[190px] bg-white">
              <SelectValue placeholder="Todos os responsáveis">
                {(value: string) =>
                  value === "all" ? "Todos os responsáveis" : labelFromOptions(value, uniqueOwners, "Todos os responsáveis")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {uniqueOwners.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterTitle(""); setFilterOwner("all"); }}
              className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
            >
              ✕ Limpar
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {isMock
              ? "Nenhuma meta cadastrada"
              : `${processedGoals.length} de ${goals.length} meta${goals.length !== 1 ? "s" : ""}`}
          </p>
          <Button onClick={openCreate} className="bg-[#364B59] hover:bg-[#2D3F4A] text-white text-sm">
            + Nova Meta
          </Button>
        </div>
      </div>

      {isMock && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Pré-visualização — os dados abaixo são apenas um exemplo. Clique em &quot;+ Nova Meta&quot; para cadastrar a primeira meta real.
        </p>
      )}

      <div className={`rounded-xl border border-border bg-white overflow-hidden${isMock ? " opacity-50 pointer-events-none select-none" : ""}`}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#364B59]/20">
              <TableHead
                className="cursor-pointer select-none hover:text-[#364B59]"
                onClick={() => !isMock && toggleSort("title")}
              >
                Título <SortArrow col="title" sortCol={sortCol} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-[#364B59]"
                onClick={() => !isMock && toggleSort("owner")}
              >
                Responsável <SortArrow col="owner" sortCol={sortCol} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:text-[#364B59]"
                onClick={() => !isMock && toggleSort("department")}
              >
                Departamento <SortArrow col="department" sortCol={sortCol} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className="text-center cursor-pointer select-none hover:text-[#364B59]"
                onClick={() => !isMock && toggleSort("period")}
              >
                Período <SortArrow col="period" sortCol={sortCol} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className="text-right cursor-pointer select-none hover:text-[#364B59]"
                onClick={() => !isMock && toggleSort("target_value")}
              >
                Meta <SortArrow col="target_value" sortCol={sortCol} sortDir={sortDir} />
              </TableHead>
              <TableHead
                className="text-center cursor-pointer select-none hover:text-[#364B59]"
                onClick={() => !isMock && toggleSort("weight")}
              >
                Peso <SortArrow col="weight" sortCol={sortCol} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-center">Subpeso</TableHead>
              <TableHead
                className="text-center cursor-pointer select-none hover:text-[#364B59]"
                onClick={() => !isMock && toggleSort("progress")}
              >
                Progresso <SortArrow col="progress" sortCol={sortCol} sortDir={sortDir} />
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedGoals.length === 0 && !isMock ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8 text-sm">
                  Nenhuma meta encontrada para os filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              processedGoals.map(g => {
                const pct = calcProgress(Number(g.current_value), Number(g.target_value), g.operator, g.has_history);
                const dept = deptMap.get(g.department_id);
                const parentDept = dept?.parent_id ? deptMap.get(dept.parent_id) : null;
                const deptDisplay = dept
                  ? parentDept ? `${parentDept.name} › ${dept.name}` : dept.name
                  : g.department?.name ?? "—";
                return (
                  <TableRow key={g.id} className="hover:bg-surface/50">
                    <TableCell className="font-medium max-w-[200px] truncate" title={g.title}>{g.title}</TableCell>
                    <TableCell className="text-sm">{g.owner?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate" title={deptDisplay}>{deptDisplay}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        {g.period.replace("2026-", "")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono whitespace-nowrap">
                      <span className="text-muted-foreground mr-0.5 font-bold">{OP_SYMBOL[g.operator] ?? g.operator}</span>
                      {formatGoalValue(Number(g.target_value), g.unit)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-semibold text-[#F18213]">{g.weight}%</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {g.sub_weight != null
                        ? <span className="text-xs font-semibold text-[#364B59]/70">{g.sub_weight}%</span>
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
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
              })
            )}
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
