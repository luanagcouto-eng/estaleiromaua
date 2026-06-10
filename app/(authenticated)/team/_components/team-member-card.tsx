"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calcProgress, formatGoalValue, goalColor, goalTextClass } from "@/lib/utils";

const PERIOD_LABELS: Record<string, string> = {
  "2026-ANUAL": "Anual",
  "2026-Q1": "1º Trimestre",
  "2026-Q2": "2º Trimestre",
  "2026-Q3": "3º Trimestre",
  "2026-Q4": "4º Trimestre",
};

export interface TeamGoalData {
  id: string;
  title: string;
  period: string;
  weight: number;
  target_value: number;
  current_value: number;
  unit: string;
  has_history: boolean;
}

export interface TeamMemberData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  departmentName: string | null;
  consolidatedPct: number;
  goals: TeamGoalData[];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function statusInfo(pct: number, hasHistory: boolean) {
  if (!hasHistory) return { label: "Pendente", bg: "bg-slate-100", text: "text-slate-500" };
  if (pct >= 90) return { label: "Em conformidade", bg: "bg-emerald-50", text: "text-emerald-700" };
  if (pct >= 60) return { label: "Em andamento", bg: "bg-orange-50", text: "text-[#F18213]" };
  return { label: "Em risco", bg: "bg-red-50", text: "text-red-600" };
}

export default function TeamMemberCard({ member }: { member: TeamMemberData }) {
  const [open, setOpen] = useState(false);
  const pendingGoals = member.goals.filter((g) => !g.has_history);

  function handleCobrar() {
    const subject = encodeURIComponent("Lançamento de resultado pendente — Metas Mauá 2026");
    const list = pendingGoals.map((g) => `- ${g.title} (${PERIOD_LABELS[g.period] ?? g.period})`).join("\n");
    const body = encodeURIComponent(
      `Olá ${member.name.split(" ")[0]},\n\nNotei que ainda não há lançamento de resultado para as seguintes metas:\n\n${list}\n\nPode atualizar quando possível?\n\nObrigado(a)!`
    );
    window.location.href = `mailto:${member.email}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            {member.avatar_url && <AvatarImage src={member.avatar_url} alt={member.name} />}
            <AvatarFallback>{initials(member.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-[#364B59]">{member.name}</h3>
            <p className="text-xs text-muted-foreground">{member.departmentName ?? "Sem departamento"}</p>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${goalTextClass(member.consolidatedPct)}`}>
          {member.consolidatedPct}% {member.consolidatedPct >= 90 ? "🏆" : ""}
        </span>
      </div>

      <div>
        <div className="h-2.5 rounded-full bg-surface overflow-hidden border border-border">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, member.consolidatedPct)}%`, backgroundColor: "#F18213" }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">Progresso consolidado das metas anuais 2026</p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-[#364B59] hover:underline"
        >
          {open ? "Ocultar metas" : `Ver metas (${member.goals.length})`}
        </button>
        {pendingGoals.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleCobrar} className="border-[#F18213] text-[#F18213] hover:bg-[#FEF0DC]">
            Cobrar lançamento ({pendingGoals.length})
          </Button>
        )}
      </div>

      {open && (
        <div className="pt-1 border-t border-border">
          {member.goals.length === 0 ? (
            <p className="pt-3 text-xs text-muted-foreground italic px-1">Nenhuma meta atribuída ainda.</p>
          ) : (
            <div className="pt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Meta</th>
                    <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Período</th>
                    <th className="py-2 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Peso</th>
                    <th className="py-2 px-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Atual</th>
                    <th className="py-2 px-3 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Meta</th>
                    <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-40">Progresso</th>
                    <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {member.goals.map((g) => {
                    const pct = calcProgress(g.current_value, g.target_value);
                    const status = statusInfo(pct, g.has_history);
                    return (
                      <tr key={g.id} className="border-b border-border last:border-b-0">
                        <td className="py-2.5 px-3 font-medium text-text">
                          {g.title} {pct >= 90 && "🏆"}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="secondary" className="text-xs">{PERIOD_LABELS[g.period] ?? g.period}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center text-muted-foreground">{g.weight}%</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium text-text">{formatGoalValue(g.current_value, g.unit)}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium text-text">{formatGoalValue(g.target_value, g.unit)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden min-w-[60px]">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, pct)}%`, backgroundColor: goalColor(pct) }}
                              />
                            </div>
                            <span className="text-xs font-bold w-9 text-right" style={{ color: goalColor(pct) }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
