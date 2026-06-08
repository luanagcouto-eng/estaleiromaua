"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calcProgress, formatGoalValue, goalColor, goalTextClass } from "@/lib/utils";
import GoalEntryDialog from "./goal-entry-dialog";
import GoalHistoryList, { type GoalHistoryEntry } from "./goal-history-list";

export interface GoalCardData {
  id: string;
  title: string;
  description: string | null;
  period: string;
  weight: number;
  target_value: number;
  current_value: number;
  unit: string;
  history: GoalHistoryEntry[];
}

const PERIOD_LABELS: Record<string, string> = {
  "2026-ANUAL": "Anual",
  "2026-Q1": "1º Trimestre",
  "2026-Q2": "2º Trimestre",
  "2026-Q3": "3º Trimestre",
  "2026-Q4": "4º Trimestre",
};

export default function GoalCard({ goal }: { goal: GoalCardData }) {
  const [entryOpen, setEntryOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const pct = calcProgress(goal.current_value, goal.target_value);
  const fillColor = goalColor(pct);

  return (
    <div className="bg-white rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[#364B59]">{goal.title}</h3>
            <Badge variant="secondary" className="text-xs">{PERIOD_LABELS[goal.period] ?? goal.period}</Badge>
            <span className="text-xs text-muted-foreground">peso {goal.weight}%</span>
          </div>
          {goal.description && <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>}
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${goalTextClass(pct)}`}>
          {pct}% {pct >= 90 ? "🏆" : ""}
        </span>
      </div>

      <div>
        <div className="h-2.5 rounded-full bg-surface overflow-hidden border border-border">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: fillColor }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Atual: <span className="font-medium text-text">{formatGoalValue(goal.current_value, goal.unit)}</span></span>
          <span>Meta: <span className="font-medium text-text">{formatGoalValue(goal.target_value, goal.unit)}</span></span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => setHistoryOpen((v) => !v)}
          className="text-xs text-[#364B59] hover:underline"
        >
          {historyOpen ? "Ocultar histórico" : `Ver histórico (${goal.history.length})`}
        </button>
        <Button
          size="sm"
          onClick={() => setEntryOpen(true)}
          className="bg-[#F18213] hover:bg-[#D9730D] text-white"
        >
          Lançar resultado
        </Button>
      </div>

      {historyOpen && (
        <div className="pt-1 border-t border-border">
          <div className="pt-3">
            <GoalHistoryList entries={goal.history} unit={goal.unit} />
          </div>
        </div>
      )}

      <GoalEntryDialog
        open={entryOpen}
        onClose={() => setEntryOpen(false)}
        goalId={goal.id}
        goalTitle={goal.title}
        unit={goal.unit}
        targetValue={goal.target_value}
      />
    </div>
  );
}
