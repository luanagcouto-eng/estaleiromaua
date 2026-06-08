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
            <ul className="pt-3 space-y-3">
              {member.goals.map((g) => {
                const pct = calcProgress(g.current_value, g.target_value);
                return (
                  <li key={g.id} className="rounded-lg border border-border bg-surface px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-sm font-medium text-text truncate">{g.title}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">{PERIOD_LABELS[g.period] ?? g.period}</Badge>
                        {!g.has_history && (
                          <Badge className="text-xs shrink-0 bg-[#FEF0DC] text-[#F18213]">Sem lançamento</Badge>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${goalTextClass(pct)}`}>
                        {pct}% {pct >= 90 ? "🏆" : ""}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white overflow-hidden border border-border">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: goalColor(pct) }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Atual: <span className="font-medium text-text">{formatGoalValue(g.current_value, g.unit)}</span></span>
                      <span>Meta: <span className="font-medium text-text">{formatGoalValue(g.target_value, g.unit)}</span></span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
