"use client";

import React, { useState } from "react";
import { Target } from "lucide-react";
import { calcProgress, formatGoalValue, progressBarPct, OP_SYMBOL } from "@/lib/utils";
import GoalEntryDialog from "./goal-entry-dialog";
import GoalHistoryList from "./goal-history-list";
import type { GoalCardData } from "./goal-card";
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

const CURRENT_QUARTER = (() => {
  const m = new Date().getMonth() + 1;
  if (m <= 3) return "2026-Q1";
  if (m <= 6) return "2026-Q2";
  if (m <= 9) return "2026-Q3";
  return "2026-Q4";
})();

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ goal }: { goal: GoalCardData }) {
  const pct   = calcProgress(goal.current_value, goal.target_value, goal.operator, goal.history.length > 0);
  const color = progressColor(pct);

  return (
    <div className="bg-white rounded-xl border border-border p-4 flex flex-col min-w-[148px] flex-shrink-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-tight line-clamp-2">
        {goal.title}
      </p>
      <p className="text-3xl font-black mt-2 leading-none" style={{ color }}>
        {pct}%
      </p>
      <div className="mt-3 h-[3px] bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progressBarPct(pct)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Period Table ─────────────────────────────────────────────────────────────

function GoalTableSection({
  title,
  goals,
  expandedId,
  onToggle,
  onLaunch,
}: {
  title: string;
  goals: GoalCardData[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onLaunch: (goal: GoalCardData) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-6 py-3 bg-[#364B59]/20">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#364B59]">
          <Target className="w-5 h-5" aria-hidden />
          {title}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#364B59]/10">
              <th className="py-2.5 px-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#364B59]/70 min-w-[220px]">
                Objetivo Estratégico
              </th>
              <th className="py-2.5 px-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#364B59]/70 w-20">
                Subpeso
              </th>
              <th className="py-2.5 px-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#364B59]/70 w-28">
                Meta
              </th>
              <th className="py-2.5 px-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#364B59]/70 w-48">
                Atingimento (%)
              </th>
              <th className="py-2.5 px-4 text-left text-[11px] font-bold uppercase tracking-wider text-[#364B59]/70 w-40">
                Avaliação Técnica
              </th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => {
              const hasHistory = goal.history.length > 0;
              const pct        = calcProgress(goal.current_value, goal.target_value, goal.operator, hasHistory);
              const { label, bg, text } = statusInfo(pct, hasHistory);
              const color      = progressColor(pct);
              const isExpanded = expandedId === goal.id;

              return (
                <React.Fragment key={goal.id}>
                  {/* main row */}
                  <tr
                    onClick={() => onToggle(goal.id)}
                    className={`border-t border-slate-100 cursor-pointer transition-colors ${
                      isExpanded ? "bg-slate-50" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <svg
                          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[#364B59]">{goal.title}</p>
                            {goal.sector && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#364B59]/60 bg-[#364B59]/8 px-1.5 py-0.5 rounded-full">
                                {goal.sector}
                              </span>
                            )}
                          </div>
                          {goal.ownerName && (
                            <p className="text-[11px] text-[#F18213] font-semibold mt-0.5">{goal.ownerName}</p>
                          )}
                          {goal.description && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-sm">
                              {goal.description}
                            </p>
                          )}
                        </div>
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
                            style={{ width: `${progressBarPct(pct)}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="text-xs font-bold w-9 text-right" style={{ color }}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full ${bg} ${text}`}>
                        {label}
                      </span>
                    </td>
                  </tr>

                  {/* expanded detail row */}
                  {isExpanded && (
                    <tr className="bg-slate-50/80">
                      <td colSpan={5} className="px-8 py-4 border-t border-slate-100">
                        <div className="space-y-3">
                          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                            Histórico de lançamentos
                          </p>
                          <GoalHistoryList entries={goal.history} goal={goal} />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onLaunch(goal); }}
                            className="text-xs font-bold bg-[#F18213] hover:bg-[#D9730D] text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            + Lançar resultado
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function GoalsExecutiveTable({ goals }: { goals: GoalCardData[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [entryGoal, setEntryGoal]   = useState<GoalCardData | null>(null);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [titleFilter, setTitleFilter]   = useState("");

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

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
          className="h-8 text-sm w-[220px] bg-white"
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
            className={`px-3 py-1.5 text-sm rounded-md transition-colors relative ${
              periodFilter === f.value
                ? "bg-[#364B59] text-white font-medium"
                : "text-muted-foreground hover:text-[#364B59] hover:bg-surface"
            }`}
          >
            {f.label}
            {f.value === CURRENT_QUARTER && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#F18213] border border-white" title="Trimestre atual — lançamento obrigatório" />
            )}
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
        <GoalTableSection
          key={period}
          title={PERIOD_LABELS[period] ?? period}
          goals={list}
          expandedId={expandedId}
          onToggle={toggle}
          onLaunch={setEntryGoal}
        />
      ))}

      {entryGoal && (
        <GoalEntryDialog
          key={entryGoal.id}
          open
          onClose={() => setEntryGoal(null)}
          goalId={entryGoal.id}
          goalTitle={entryGoal.title}
          unit={entryGoal.unit}
          targetValue={entryGoal.target_value}
          operator={entryGoal.operator}
          goalPeriod={entryGoal.period}
        />
      )}
    </div>
  );
}
