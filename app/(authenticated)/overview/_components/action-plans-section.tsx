"use client";

import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { goalTextClass, goalColor, formatGoalValue, progressBarPct, OP_SYMBOL } from "@/lib/utils";

const PERIOD_LABELS: Record<string, string> = {
  "2026-ANUAL": "Anual",
  "2026-Q1": "T1",
  "2026-Q2": "T2",
  "2026-Q3": "T3",
  "2026-Q4": "T4",
};

export interface ActionPlanItem {
  id: string;
  goalId: string;
  goalTitle: string;
  directorateId: string | null;
  period: string | null;
  actionPlan: string;
  progress: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  operator: string;
}

interface Props {
  actionPlans: ActionPlanItem[];
  scopeId: string;
}

export default function ActionPlansSection({ actionPlans, scopeId }: Props) {
  const filtered =
    scopeId === "all" ? actionPlans : actionPlans.filter((p) => p.directorateId === scopeId);

  return (
    <div className="bg-white">
      <div className="mb-4 px-6 py-3 bg-[#364B59]/20">
        <h3 className="flex items-center gap-2 text-base font-semibold text-[#364B59]">
          <ClipboardList className="w-5 h-5" aria-hidden />
          Planos de ação em andamento
        </h3>
      </div>

      <div className="px-8 pb-6">
      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          Nenhum plano de ação em andamento para o escopo selecionado.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-lg border border-border px-3.5 py-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-[#364B59] leading-snug">{p.goalTitle}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {p.period && (
                    <span className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded-full text-muted-foreground">
                      {PERIOD_LABELS[p.period] ?? p.period}
                    </span>
                  )}
                  <Badge className={`text-[11px] px-2 py-0.5 ${goalTextClass(p.progress)}`}>{p.progress}%</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Atual: <span className="font-semibold text-text">{formatGoalValue(p.currentValue, p.unit)}</span>
                {" "}/ Meta: <span className="font-mono font-bold text-muted-foreground">{OP_SYMBOL[p.operator] ?? p.operator}</span>{" "}
                <span className="font-semibold text-text">{formatGoalValue(p.targetValue, p.unit)}</span>
              </p>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progressBarPct(p.progress)}%`, backgroundColor: goalColor(p.progress) }}
                />
              </div>
              <div className="pt-1">
                <p className="text-xs font-semibold text-[#364B59]">Plano de ação</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{p.actionPlan}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
