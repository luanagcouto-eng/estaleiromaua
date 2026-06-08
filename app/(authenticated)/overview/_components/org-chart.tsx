"use client";

import { useState } from "react";
import OrgNode from "./org-node";
import NodeDetailSheet, { type NodeDetail } from "./node-detail-sheet";

export interface OrgChartNodeData {
  id: string;
  name: string;
  director: string | null;
  isPlaceholder: boolean;
  progress: number;
  goalsCount: number;
  goalsCompleted: number;
  subDepartments: { id: string; name: string; progress: number }[];
}

interface Props {
  ceo: { name: string | null; isPlaceholder: boolean; progress: number; goalsCount: number; goalsCompleted: number };
  nodes: OrgChartNodeData[];
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
      }
    : null;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[920px] flex flex-col items-center px-6 pt-2">
        {/* Nó CEO */}
        <div className="w-64">
          <OrgNode
            label={ceo.name ?? "CEO"}
            subtitle={ceo.isPlaceholder ? "Cargo em aberto" : "Estaleiro Mauá"}
            progress={ceo.progress}
            isPlaceholder={ceo.isPlaceholder}
            isCeo
          />
        </div>

        {/* Conector vertical CEO → linha horizontal */}
        <div className="h-8 w-px bg-border" />

        {/* Linha horizontal conectando as 5 diretorias */}
        <div className="relative w-full">
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-border" />

          <div className="grid grid-cols-5 gap-4 pt-8">
            {nodes.map((node) => (
              <div key={node.id} className="relative flex flex-col items-center">
                <div className="absolute -top-8 h-8 w-px bg-border" />
                <OrgNode
                  label={node.name}
                  subtitle={node.isPlaceholder ? "Em aberto" : node.director ?? ""}
                  progress={node.progress}
                  isPlaceholder={node.isPlaceholder}
                  selected={selectedId === node.id}
                  onClick={() => setSelectedId(node.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <NodeDetailSheet node={detail} onClose={() => setSelectedId(null)} />
    </div>
  );
}
