"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calcProgress, formatGoalValue, OP_SYMBOL } from "@/lib/utils";
import ProgressRing from "@/components/ui/progress-ring";
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
  operator: string;
  sub_weight: number | null;
  owner_id?: string;
  ownerName?: string;
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

  return (
    <div className="bg-white rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-start gap-4">
        <ProgressRing pct={pct} size={72} stroke={7} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-[#364B59]">{goal.title}</h3>
                <Badge variant="secondary" className="text-xs">{PERIOD_LABELS[goal.period] ?? goal.period}</Badge>
                <span className="text-xs text-muted-foreground">peso {goal.weight}%</span>
              </div>
              {goal.description && <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>}
            </div>
            {pct >= 90 && <span className="text-lg shrink-0">🏆</span>}
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Atual: <span className="font-medium text-text">{formatGoalValue(goal.current_value, goal.unit)}</span></span>
            <span>
              Meta:{" "}
              <span className="font-bold font-mono">{OP_SYMBOL[goal.operator] ?? goal.operator}</span>{" "}
              <span className="font-medium text-text">{formatGoalValue(goal.target_value, goal.unit)}</span>
            </span>
          </div>
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
            <GoalHistoryList entries={goal.history} goal={goal} />
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
        operator={goal.operator}
        goalPeriod={goal.period}
      />
    </div>
  );
}
