"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatGoalValue, goalTextClass, OP_SYMBOL } from "@/lib/utils";

export interface GoalReportRow {
  id: string;
  title: string;
  period: string;
  weight: number;
  target_value: number;
  current_value: number;
  unit: string;
  operator: string;
  owner_name: string;
  department_name: string;
  has_history: boolean;
  progress_pct: number;
}

const PERIOD_LABELS: Record<string, string> = {
  "2026-ANUAL": "Anual",
  "2026-Q1": "T1",
  "2026-Q2": "T2",
  "2026-Q3": "T3",
  "2026-Q4": "T4",
};

const FILTERS = [
  { label: "Todas", value: "all" },
  { label: "Anual", value: "2026-ANUAL" },
  { label: "T1", value: "2026-Q1" },
  { label: "T2", value: "2026-Q2" },
  { label: "T3", value: "2026-Q3" },
  { label: "T4", value: "2026-Q4" },
];

const MOCK_ROWS: GoalReportRow[] = [
  { id: "__m1", title: "Receita Bruta Anual", period: "2026-ANUAL", weight: 40, target_value: 1200000, current_value: 480000, unit: "R$", operator: ">=", owner_name: "João da Silva", department_name: "Operações Navais", has_history: true, progress_pct: 40 },
  { id: "__m2", title: "Cumprimento de Prazo de Entrega", period: "2026-ANUAL", weight: 30, target_value: 95, current_value: 72, unit: "%", operator: ">=", owner_name: "Maria Souza", department_name: "Engenharia Naval", has_history: true, progress_pct: 76 },
  { id: "__m3", title: "NPS — Satisfação do Cliente", period: "2026-Q1", weight: 20, target_value: 80, current_value: 65, unit: "pontos", operator: ">=", owner_name: "Carlos Lima", department_name: "Qualidade", has_history: false, progress_pct: 81 },
  { id: "__m4", title: "Horas de Capacitação", period: "2026-Q2", weight: 10, target_value: 200, current_value: 45, unit: "horas", operator: ">=", owner_name: "Ana Pereira", department_name: "Recursos Humanos", has_history: false, progress_pct: 23 },
  { id: "__m5", title: "Índice de Retrabalho", period: "2026-ANUAL", weight: 30, target_value: 5, current_value: 2, unit: "%", operator: "<=", owner_name: "Pedro Alves", department_name: "Produção", has_history: true, progress_pct: 40 },
  { id: "__m6", title: "Faturamento T2", period: "2026-Q2", weight: 25, target_value: 350000, current_value: 340000, unit: "R$", operator: ">=", owner_name: "Fernanda Costa", department_name: "Comercial", has_history: true, progress_pct: 97 },
];

function exportCSV(rows: GoalReportRow[]) {
  const header = ["Título", "Responsável", "Departamento", "Período", "Meta", "Atual", "Unidade", "Peso (%)", "Progresso (%)", "Lançamento"].join(",");
  const lines = rows.map((r) =>
    [
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.owner_name}"`,
      `"${r.department_name}"`,
      PERIOD_LABELS[r.period] ?? r.period,
      r.target_value,
      r.current_value,
      r.unit,
      r.weight,
      r.progress_pct,
      r.has_history ? "Sim" : "Não",
    ].join(",")
  );
  const csv = "﻿" + [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "relatorio-metas-2026.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsView({ rows }: { rows: GoalReportRow[] }) {
  const [filter, setFilter] = useState("all");

  const isMock = rows.length === 0;
  const source = isMock ? MOCK_ROWS : rows;

  const filtered = useMemo(
    () => (filter === "all" ? source : source.filter((r) => r.period === filter)),
    [source, filter]
  );

  const annualGoals = filtered.filter((r) => r.period === "2026-ANUAL");
  const totalWeight = annualGoals.reduce((s, r) => s + r.weight, 0);
  const consolidatedPct =
    totalWeight > 0
      ? Math.round(
          (annualGoals.reduce(
            (s, r) => s + (r.target_value > 0 ? r.current_value / r.target_value : 0) * r.weight,
            0
          ) /
            totalWeight) *
            100
        )
      : null;

  const atRisk = filtered.filter((r) => r.progress_pct < 50 && r.target_value > 0).length;
  const noHistory = filtered.filter((r) => !r.has_history).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total de metas" value={filtered.length.toString()} />
        <SummaryCard
          label="Consolidado anual"
          value={consolidatedPct !== null ? `${consolidatedPct}%` : "—"}
          note="metas anuais ponderadas"
        />
        <SummaryCard
          label="Metas em risco"
          value={atRisk.toString()}
          note="abaixo de 50%"
          accent={atRisk > 0 ? "warning" : undefined}
        />
        <SummaryCard
          label="Sem lançamento"
          value={noHistory.toString()}
          accent={noHistory > 0 ? "warning" : undefined}
        />
      </div>

      {isMock && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Pré-visualização — os dados abaixo são apenas um exemplo. Cadastre metas em &quot;Metas&quot; para ver os dados reais.
        </p>
      )}

      {/* Filters + export */}
      <div className="no-print flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === f.value
                  ? "bg-[#364B59] text-white font-medium"
                  : "text-muted-foreground hover:text-[#364B59] hover:bg-surface"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(filtered)}
            disabled={isMock}
            className="text-[#364B59] border-[#364B59] hover:bg-[#364B59] hover:text-white"
          >
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            disabled={isMock}
            aria-label="Imprimir relatório como PDF"
            className="text-[#364B59] border-[#364B59] hover:bg-[#364B59] hover:text-white"
          >
            Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-xl border border-border bg-white overflow-hidden${isMock ? " opacity-50 pointer-events-none select-none" : ""}`}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#364B59]/20">
              <TableHead>Título</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="text-center">Período</TableHead>
              <TableHead className="text-right">Meta</TableHead>
              <TableHead className="text-right">Atual</TableHead>
              <TableHead className="text-center">Peso</TableHead>
              <TableHead className="text-center">Progresso</TableHead>
              <TableHead className="text-center">Lançamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                  Nenhuma meta encontrada para este período.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-surface/50">
                  <TableCell className="font-medium max-w-[180px] truncate" title={r.title}>
                    {r.title}
                  </TableCell>
                  <TableCell className="text-sm">{r.owner_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate" title={r.department_name}>
                    {r.department_name}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {PERIOD_LABELS[r.period] ?? r.period}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    <span className="text-muted-foreground mr-0.5 font-bold">{OP_SYMBOL[r.operator] ?? r.operator}</span>
                    {formatGoalValue(r.target_value, r.unit)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {formatGoalValue(r.current_value, r.unit)}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs font-semibold text-[#F18213]">{r.weight}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${goalTextClass(r.progress_pct)}`}>
                      {r.progress_pct}%{r.progress_pct >= 90 && r.progress_pct < 100 ? " 🏆" : ""}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {r.has_history ? (
                      <span className="text-xs text-green-600 font-medium">Sim</span>
                    ) : (
                      <Badge className="text-xs bg-[#FEF0DC] text-[#F18213] border-0">Pendente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: "warning";
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent === "warning" ? "border-amber-200 bg-amber-50" : "border-border bg-white"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent === "warning" ? "text-amber-700" : "text-[#364B59]"}`}>
        {value}
      </p>
      {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
    </div>
  );
}
