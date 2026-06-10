"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatGoalValue } from "@/lib/utils";
import { deleteGoalEntry } from "@/lib/actions/goal-history";
import GoalEntryDialog from "./goal-entry-dialog";

const PERIOD_LABELS: Record<string, string> = {
  "2026-ANUAL": "Anual (2026)",
  "2026-Q1": "1º Trimestre (T1)",
  "2026-Q2": "2º Trimestre (T2)",
  "2026-Q3": "3º Trimestre (T3)",
  "2026-Q4": "4º Trimestre (T4)",
};

export interface GoalHistoryEntry {
  id: string;
  value: number;
  period: string | null;
  notes: string | null;
  data_source: string | null;
  criteria: string | null;
  formula_used: string | null;
  justification: string | null;
  five_whys: string[] | null;
  action_plan: string | null;
  evidence_url: string[] | null;
  recorded_at: string;
}

export interface GoalHistoryGoalContext {
  id: string;
  title: string;
  unit: string;
  target_value: number;
  operator: string;
  period: string;
}

interface Props {
  entries: GoalHistoryEntry[];
  goal: GoalHistoryGoalContext;
}

export default function GoalHistoryList({ entries, goal }: Props) {
  const [editingEntry, setEditingEntry] = useState<GoalHistoryEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Excluir este lançamento? Esta ação não pode ser desfeita.")) return;

    setDeletingId(id);
    const result = await deleteGoalEntry(id);
    setDeletingId(null);

    if (result?.error) {
      toast.error("Erro ao excluir lançamento.");
      return;
    }
    toast.success("Lançamento excluído.");
  }

  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic px-1">
        Nenhum lançamento registrado ainda.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-text">{formatGoalValue(entry.value, goal.unit)}</span>
                {entry.period && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#F18213] bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
                    {PERIOD_LABELS[entry.period] ?? entry.period}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(entry.recorded_at).toLocaleString("pt-BR", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit", hour12: false,
                  })}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditingEntry(entry); }}
                  title="Editar lançamento"
                  className="p-1 rounded text-muted-foreground hover:text-[#364B59] hover:bg-slate-100 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, entry.id)}
                  disabled={deletingId === entry.id}
                  title="Excluir lançamento"
                  className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {(entry.data_source || entry.criteria || entry.formula_used) && (
              <dl className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {entry.data_source && (
                  <div>
                    <dt className="font-semibold text-text">Fonte de dados</dt>
                    <dd className="whitespace-pre-wrap">{entry.data_source}</dd>
                  </div>
                )}
                {entry.criteria && (
                  <div>
                    <dt className="font-semibold text-text">Critério</dt>
                    <dd className="whitespace-pre-wrap">{entry.criteria}</dd>
                  </div>
                )}
                {entry.formula_used && (
                  <div>
                    <dt className="font-semibold text-text">Fórmula utilizada</dt>
                    <dd className="whitespace-pre-wrap">{entry.formula_used}</dd>
                  </div>
                )}
              </dl>
            )}

            {entry.notes && <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{entry.notes}</p>}

            {entry.justification && (
              <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  ⚠️ Meta ultrapassada
                </p>
                <div>
                  <p className="text-xs font-semibold text-text">Justificativa</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{entry.justification}</p>
                </div>
                {entry.five_whys && entry.five_whys.some((w) => w) && (
                  <div>
                    <p className="text-xs font-semibold text-text">Análise de causa raiz — 5 Porquês</p>
                    <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-0.5">
                      {entry.five_whys.map((why, i) => (
                        <li key={i}>{why}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {entry.action_plan && (
                  <div>
                    <p className="text-xs font-semibold text-text">Plano de ação</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{entry.action_plan}</p>
                  </div>
                )}
              </div>
            )}

            {entry.evidence_url && entry.evidence_url.length > 0 && (
              <a
                href={entry.evidence_url[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs text-[#F18213] hover:underline"
              >
                Ver evidência ↗
              </a>
            )}
          </li>
        ))}
      </ul>

      {editingEntry && (
        <GoalEntryDialog
          key={editingEntry.id}
          open
          onClose={() => setEditingEntry(null)}
          goalId={goal.id}
          goalTitle={goal.title}
          unit={goal.unit}
          targetValue={goal.target_value}
          operator={goal.operator}
          goalPeriod={goal.period}
          entry={editingEntry}
        />
      )}
    </>
  );
}
