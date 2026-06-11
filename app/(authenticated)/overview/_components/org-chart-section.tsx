"use client";

import { useState } from "react";
import { Network, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labelFromOptions } from "@/lib/utils";
import OrgChart, { type OrgChartNodeData } from "./org-chart";
import ActionPlansSection, { type ActionPlanItem } from "./action-plans-section";

interface DirectorateOption {
  id: string;
  name: string;
}

// ── Legend swatch ─────────────────────────────────────────────────
function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2 w-2 rounded-full border border-border" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

interface Props {
  ceo: { name: string | null; isPlaceholder: boolean; progress: number; goalsCount: number; goalsCompleted: number };
  nodes: OrgChartNodeData[];
  directorateOptions: DirectorateOption[];
  canCustomize: boolean;
  defaultScopeId: string | null;
  actionPlans: ActionPlanItem[];
}

export default function OrgChartSection({
  ceo,
  nodes,
  directorateOptions,
  canCustomize,
  defaultScopeId,
  actionPlans,
}: Props) {
  const [scopeId, setScopeId] = useState<string>(defaultScopeId ?? "all");

  return (
    <div className="bg-white">
      <div className="-mt-8 mb-4 px-6 py-3 flex items-center justify-between bg-[#364B59]/20">
        <h3 className="flex items-center gap-2 text-base font-semibold text-[#364B59]">
          <Network className="w-5 h-5" aria-hidden />
          Organograma
        </h3>

        {canCustomize && (
          <Select value={scopeId} onValueChange={(v) => setScopeId(v ?? "all")}>
            <SelectTrigger size="sm" className="bg-white">
              <SelectValue placeholder="Visão geral">
                {(value: string) =>
                  value === "all" ? "Visão geral (todas as diretorias)" : labelFromOptions(value, directorateOptions, "Visão geral")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Visão geral (todas as diretorias)</SelectItem>
              {directorateOptions.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <OrgChart ceo={ceo} nodes={nodes} scopeId={scopeId} />

      {/* Legend + Info */}
      <div className="border-t border-border px-8 pt-5 pb-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[12px] font-semibold text-[#364B59] mb-1.5">Legenda de progresso</p>
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
              <LegendSwatch color="#DFA1AA" label="0% – 33%" />
              <LegendSwatch color="#F9E79F" label="33% – 66%" />
              <LegendSwatch color="#9AD595" label="66% – 100%" />
            </div>
          </div>

          <div className="flex items-start gap-3 bg-surface border border-border rounded-xl px-4 py-3 max-w-sm">
            <Info className="w-4 h-4 text-[#364B59]/50 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-xs font-semibold text-[#364B59] leading-snug">
                Clique em uma diretoria para visualizar as metas, responsáveis e iniciativas.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Acompanhe o desempenho e foque nas prioridades para alcançar os resultados esperados.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <ActionPlansSection actionPlans={actionPlans} scopeId={scopeId} />
      </div>
    </div>
  );
}
