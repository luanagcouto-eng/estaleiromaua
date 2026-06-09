"use client";

import { useState } from "react";
import OrgNode from "./org-node";
import NodeDetailSheet, { type NodeDetail } from "./node-detail-sheet";

export interface GoalItem {
  id: string;
  title: string;
  period: string;
  progress: number;
}

export interface OrgChartNodeData {
  id: string;
  name: string;
  director: string | null;
  isPlaceholder: boolean;
  progress: number;
  goalsCount: number;
  goalsCompleted: number;
  subDepartments: { id: string; name: string; progress: number; sectors: { id: string; name: string }[] }[];
  goals: GoalItem[];
}

interface Props {
  ceo: { name: string | null; isPlaceholder: boolean; progress: number; goalsCount: number; goalsCompleted: number };
  nodes: OrgChartNodeData[];
}

function SectionChip({ label }: { label: string }) {
  return (
    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
      {label}
    </span>
  );
}

export default function OrgChart({ ceo, nodes }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const detail: NodeDetail | null = selectedNode
    ? {
        id: selectedNode.id,
        name: selectedNode.name,
        director: selectedNode.director,
        isPlaceholder: selectedNode.isPlaceholder,
        progress: selectedNode.progress,
        goalsCount: selectedNode.goalsCount,
        goalsCompleted: selectedNode.goalsCompleted,
        subDepartments: selectedNode.subDepartments,
        goals: selectedNode.goals,
      }
    : null;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[920px] flex flex-col items-center px-6 pt-2 gap-0">

        {/* ── Seção: Presidência ── */}
        <div className="flex flex-col items-center gap-0">
          <SectionChip label="Presidência" />
          <div className="h-3 w-px bg-slate-300" />
          <div className="w-64">
            <OrgNode
              label={ceo.name ?? "CEO"}
              subtitle={ceo.isPlaceholder ? "Cargo em aberto" : "Estaleiro Mauá"}
              progress={ceo.progress}
              goalsCount={ceo.goalsCount}
              isPlaceholder={ceo.isPlaceholder}
              isCeo
            />
          </div>
        </div>

        {/* Conector CEO → seção Diretorias */}
        <div className="flex flex-col items-center gap-0">
          <div className="h-4 w-px bg-slate-400" />
          <SectionChip label="Diretorias" />
          <div className="h-4 w-px bg-slate-400" />
        </div>

        {/* ── Seção: Diretorias ── */}
        <div className="relative w-full">
          {/* Linha horizontal conectando as diretorias */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-slate-400" />

          <div className="grid grid-cols-5 gap-4 pt-8">
            {nodes.map((node) => (
              <div key={node.id} className="relative flex flex-col items-center">
                {/* Conector vertical descendo da linha horizontal */}
                <div className="absolute -top-8 h-8 w-px bg-slate-400" />
                <OrgNode
                  label={node.name}
                  subtitle={node.isPlaceholder ? "Em aberto" : node.director ?? ""}
                  progress={node.progress}
                  goalsCount={node.goalsCount}
                  isPlaceholder={node.isPlaceholder}
                  selected={selectedId === node.id}
                  onClick={() => setSelectedId(node.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé de instrução */}
        <p className="mt-6 text-[10px] text-slate-400 text-center">
          Clique em uma diretoria para ver metas e áreas subordinadas
        </p>
      </div>

      <NodeDetailSheet node={detail} onClose={() => setSelectedId(null)} />
    </div>
  );
}
