"use client";

import { useState } from "react";
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
      {canCustomize && (
        <div className="px-6 flex justify-end mb-4">
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
        </div>
      )}

      <OrgChart ceo={ceo} nodes={nodes} scopeId={scopeId} />

      <div className="border-t border-border">
        <ActionPlansSection actionPlans={actionPlans} scopeId={scopeId} />
      </div>
    </div>
  );
}
