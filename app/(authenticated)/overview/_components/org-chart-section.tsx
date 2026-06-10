"use client";

import { useState } from "react";
import { Network } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labelFromOptions } from "@/lib/utils";
import OrgChart, { type OrgChartNodeData } from "./org-chart";
import ActionPlansSection, { type ActionPlanItem } from "./action-plans-section";

interface DirectorateOption {
  id: string;
  name: string;
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

      <div className="border-t border-border">
        <ActionPlansSection actionPlans={actionPlans} scopeId={scopeId} />
      </div>
    </div>
  );
}
