"use client";

import { useState } from "react";
import { calcProgress, formatGoalValue, OP_SYMBOL } from "@/lib/utils";
import type { GoalCardData } from "../../my-goals/_components/goal-card";
import { Input } from "@/components/ui/input";

// ─── helpers ─────────────────────────────────────────────────────────────────

function progressColor(pct: number) {
  if (pct >= 90) return "#22c55e";
  if (pct >= 60) return "#F18213";
  return "#ef4444";
}

function statusInfo(pct: number, hasHistory: boolean) {
  if (!hasHistory)  return { label: "PENDENTE",         bg: "bg-slate-100",   text: "text-slate-500"  };
  if (pct >= 90)    return { label: "EM CONFORMIDADE",  bg: "bg-emerald-50",  text: "text-emerald-700" };
  if (pct >= 60)    return { label: "EM ANDAMENTO",     bg: "bg-orange-50",   text: "text-[#F18213]"  };
  return              { label: "EM RISCO",              bg: "bg-red-50",      text: "text-red-600"    };
}

const PERIOD_LABELS: Record<string, string> = {
  "2026-ANUAL": "Resumo Executivo · Rating Ponderado",
  "2026-Q1":    "1º Trimestre",
  "2026-Q2":    "2º Trimestre",
  "2026-Q3":    "3º Trimestre",
  "2026-Q4":    "4º Trimestre",
};
const PERIOD_ORDER = ["2026-ANUAL", "2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"] as const;

const PERIOD_FILTERS = [
  { label: "Todas",  value: "all"        },
  { label: "Anual",  value: "2026-ANUAL" },
  { label: "T1",     value: "2026-Q1"    },
  { label: "T2",     value: "2026-Q2"    },
  { label: "T3",     value: "2026-Q3"    },
  { label: "T4",     value: "2026-Q4"    },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ goal }: { goal: GoalCardData }) {
  const pct   = calcProgress(goal.current_value, goal.target_value);
  const color = progressColor(pct);

  return (
    <div className="bg-white rounded-xl border border-border p-4 flex flex-col min-w-[148px] flex-shrink-0">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-tight line-clamp-2">
        {goal.title}
      </p>
      <p className="text-3xl font-black mt-2 leading-none" style={{ color }}>
        {pct}%
      </p>
      <div className="mt-3 h-[3px] bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Period Table ─────────────────────────────────────────────────────────────

function GoalTableSection({ title, goals }: { title: string; goals: GoalCardData[] }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3 bg-[#364B59]">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#2D3F4A]">
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-300 min-w-[220px]">
                Objetivo Estratégico
              </th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-300 w-20">
                Subpeso
              </th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-300 w-28">
                Meta
              </th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-300 w-48">
                Atingimento (%)
              </th>
              <th className="py-2.5 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-300 w-40">
                Avaliação Técnica
              </th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => {
              const pct        = calcProgress(goal.current_value, goal.target_value);
              const hasHistory = goal.history.length > 0;
              const { label, bg, text } = statusInfo(pct, hasHistory);
              const color      = progressColor(pct);

              return (
                <tr key={goal.id} className="border-t border-slate-100">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-semibold text-[#364B59]">{goal.title}</p>
                      {goal.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-sm">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {goal.sub_weight != null ? `${goal.sub_weight}%` : `${goal.weight}%`}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-400 mr-0.5">{OP_SYMBOL[goal.operator] ?? goal.operator}</span>
                    {formatGoalValue(goal.target_value, goal.unit)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden min-w-[80px]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-xs font-bold w-9 text-right" style={{ color }}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${bg} ${text}`}>
                      {label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function MyTargetsTable({ goals }: { goals: GoalCardData[] }) {
  const [periodFilter, setPeriodFilter] = useState("all");
  const [titleFilter, setTitleFilter]   = useState("");

  const byTitle  = titleFilter ? goals.filter((g) => g.title.toLowerCase().includes(titleFilter.toLowerCase())) : goals;
  const filtered = periodFilter === "all" ? byTitle : byTitle.filter((g) => g.period === periodFilter);
  const grouped  = PERIOD_ORDER
    .map((period) => ({ period, list: filtered.filter((g) => g.period === period) }))
    .filter(({ list }) => list.length > 0);

  return (
    <div className="space-y-5">
      {/* Barra de filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Buscar por título..."
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
          className="h-8 text-sm w-[220px]"
        />
        {titleFilter && (
          <button
            onClick={() => setTitleFilter("")}
            className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
          >
            ✕ Limpar
          </button>
        )}
      </div>

      {/* Filtro de período */}
      <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-1 w-fit">
        {PERIOD_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setPeriodFilter(f.value)}
            aria-pressed={periodFilter === f.value}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              periodFilter === f.value
                ? "bg-[#364B59] text-white font-medium"
                : "text-muted-foreground hover:text-[#364B59] hover:bg-surface"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {filtered.map((g) => <KpiCard key={g.id} goal={g} />)}
      </div>

      {grouped.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
          {titleFilter
            ? `Nenhuma meta encontrada para "${titleFilter}".`
            : "Nenhuma meta encontrada para este período."}
        </div>
      )}

      {/* Tables per period */}
      {grouped.map(({ period, list }) => (
        <GoalTableSection key={period} title={PERIOD_LABELS[period] ?? period} goals={list} />
      ))}
    </div>
  );
}
