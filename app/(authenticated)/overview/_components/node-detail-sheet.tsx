"use client";

import { Building2, Users2, Target, TrendingUp } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { goalTextClass, goalColor, formatGoalValue, progressBarPct, OP_SYMBOL } from "@/lib/utils";

const PERIOD_LABELS: Record<string, string> = {
  "2026-ANUAL": "Anual",
  "2026-Q1": "T1",
  "2026-Q2": "T2",
  "2026-Q3": "T3",
  "2026-Q4": "T4",
};

function statusInfo(pct: number) {
  if (pct >= 90) return { label: "Em conformidade", className: "bg-emerald-50 text-emerald-700" };
  if (pct >= 60) return { label: "Em andamento", className: "bg-orange-50 text-[#F18213]" };
  return { label: "Em risco", className: "bg-red-50 text-red-600" };
}

export interface NodeDetailSector {
  id: string;
  name: string;
  responsible: string | null;
}

export interface NodeDetailSubDept {
  id: string;
  name: string;
  progress: number;
  responsible: string | null;
  sectors: NodeDetailSector[];
}

export interface NodeDetailGoal {
  id: string;
  title: string;
  period: string;
  progress: number;
  current_value: number;
  target_value: number;
  unit: string;
  operator: string;
}

export interface NodeDetail {
  id: string;
  name: string;
  director: string | null;
  isPlaceholder: boolean;
  progress: number;
  goalsCount: number;
  goalsCompleted: number;
  subDepartments: NodeDetailSubDept[];
  goals: NodeDetailGoal[];
}

interface Props {
  node: NodeDetail | null;
  onClose: () => void;
}

export default function NodeDetailSheet({ node, onClose }: Props) {
  return (
    <Sheet open={!!node} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {node && (
          <>
            <SheetHeader className="flex-row items-start gap-3">
              <span className="w-10 h-10 rounded-full bg-[#364B59]/10 border border-[#364B59]/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#364B59]/60" aria-hidden />
              </span>
              <div className="min-w-0">
                <SheetTitle className="text-[#364B59] truncate">{node.name}</SheetTitle>
                <SheetDescription className="mt-0.5">
                  {node.isPlaceholder ? (
                    <span className="italic">Cargo em aberto</span>
                  ) : (
                    <>Responsável: <span className="font-medium text-text">{node.director}</span></>
                  )}
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="px-4 pb-6 space-y-6">
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" aria-hidden />
                    Progresso consolidado 2026
                  </span>
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${statusInfo(node.progress).className}`}>
                    {statusInfo(node.progress).label}
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-3xl font-black tabular-nums" style={{ color: goalColor(node.progress) }}>
                    {node.progress.toFixed(0)}%
                  </span>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{node.goalsCount} meta{node.goalsCount !== 1 ? "s" : ""}</span>
                    <span>{node.goalsCompleted} concluída{node.goalsCompleted !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-white overflow-hidden border border-border">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressBarPct(node.progress)}%`, backgroundColor: "#F18213" }}
                  />
                </div>
              </div>

              {node.subDepartments.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#364B59] mb-2">
                    <Users2 className="w-4 h-4" aria-hidden />
                    Áreas subordinadas
                  </h3>
                  <ul className="space-y-2">
                    {node.subDepartments.map((sub) => (
                      <li key={sub.id} className="rounded-lg border border-border px-3 py-2.5 text-sm space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-text font-medium truncate">{sub.name}</p>
                            {sub.responsible && (
                              <p className="text-xs truncate text-muted-foreground">{sub.responsible}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className={`shrink-0 ${goalTextClass(sub.progress)}`}>
                            {sub.progress.toFixed(0)}%
                          </Badge>
                        </div>
                        {sub.sectors.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {sub.sectors.map((s) => (
                              <span
                                key={s.id}
                                title={s.responsible ? `Responsável: ${s.responsible}` : "Cargo em aberto"}
                                className="text-[11px] bg-[#364B59]/5 border border-[#364B59]/10 px-2 py-0.5 rounded-full text-[#364B59]/60"
                              >
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {node.goals.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#364B59] mb-2">
                    <Target className="w-4 h-4" aria-hidden />
                    Metas atribuídas
                  </h3>
                  <ul className="space-y-2">
                    {node.goals.map((goal) => (
                      <li key={goal.id} className="rounded-lg border border-border px-3 py-2.5 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm text-[#364B59] font-medium leading-snug">{goal.title}</span>
                          <span className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded-full text-muted-foreground shrink-0">
                            {PERIOD_LABELS[goal.period] ?? goal.period}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            Atual: <span className="font-semibold text-text">{formatGoalValue(goal.current_value, goal.unit)}</span>
                            {" "}/ Meta: <span className="font-mono font-bold text-muted-foreground">{OP_SYMBOL[goal.operator] ?? goal.operator}</span>{" "}
                            <span className="font-semibold text-text">{formatGoalValue(goal.target_value, goal.unit)}</span>
                          </span>
                          <Badge className={`text-[11px] px-2 py-0.5 shrink-0 ${goalTextClass(goal.progress)}`}>
                            {goal.progress}%
                          </Badge>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressBarPct(goal.progress)}%`, backgroundColor: goalColor(goal.progress) }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {node.isPlaceholder && (
                <p className="text-xs text-muted-foreground italic">
                  Este cargo ainda não possui um responsável atribuído. Acesse Admin → Usuários para vincular um colaborador.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
