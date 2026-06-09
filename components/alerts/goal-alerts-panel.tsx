"use client";

import { useState } from "react";

export interface GoalAlert {
  type: "no-history" | "quarter-pending" | "at-risk";
  title: string;
  period: string;
  progress?: number;
}

const TYPE_CONFIG = {
  "no-history":       { label: "Sem lançamento",              color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200" },
  "quarter-pending":  { label: "Lançamento pendente — T2",    color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200" },
  "at-risk":          { label: "Em risco (< 50%)",            color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
} as const;

const PERIOD_LABELS: Record<string, string> = {
  "2026-ANUAL": "Anual",
  "2026-Q1": "T1",
  "2026-Q2": "T2",
  "2026-Q3": "T3",
  "2026-Q4": "T4",
};

export default function GoalAlertsPanel({ alerts }: { alerts: GoalAlert[] }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) return null;

  const groups = {
    "no-history":      alerts.filter((a) => a.type === "no-history"),
    "quarter-pending": alerts.filter((a) => a.type === "quarter-pending"),
    "at-risk":         alerts.filter((a) => a.type === "at-risk"),
  } as const;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-amber-600" aria-hidden="true">⚠</span>
          <p className="text-sm font-semibold text-amber-800">
            {alerts.length} {alerts.length === 1 ? "item precisa" : "itens precisam"} da sua atenção
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fechar painel de alertas"
          className="text-amber-500 hover:text-amber-700 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <ul className="space-y-1.5">
        {(Object.entries(groups) as [keyof typeof groups, GoalAlert[]][])
          .filter(([, items]) => items.length > 0)
          .map(([type, items]) => {
            const cfg = TYPE_CONFIG[type];
            return items.map((alert) => (
              <li
                key={`${alert.type}-${alert.title}`}
                className={`flex items-center gap-2 text-xs rounded-lg px-3 py-1.5 border ${cfg.bg} ${cfg.border}`}
              >
                <span className={`font-semibold shrink-0 ${cfg.color}`}>{cfg.label}</span>
                <span className="text-gray-700 truncate">{alert.title}</span>
                <span className={`ml-auto shrink-0 ${cfg.color}`}>
                  {PERIOD_LABELS[alert.period] ?? alert.period}
                  {alert.progress !== undefined ? ` · ${alert.progress}%` : ""}
                </span>
              </li>
            ));
          })}
      </ul>
    </div>
  );
}
