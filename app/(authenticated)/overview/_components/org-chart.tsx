"use client";

import { useState } from "react";
import { Users2, ChevronRight, Network } from "lucide-react";
import { goalColor } from "@/lib/utils";
import OrgNode from "./org-node";
import NodeDetailSheet, { type NodeDetail } from "./node-detail-sheet";

export interface GoalItem {
  id: string;
  title: string;
  period: string;
  progress: number;
  current_value: number;
  target_value: number;
  unit: string;
  operator: string;
}

export interface OrgChartSector {
  id: string;
  name: string;
  responsible: string | null;
  progress: number;
}

export interface OrgChartSubDept {
  id: string;
  name: string;
  director: string | null;
  isPlaceholder: boolean;
  progress: number;
  goalsCount: number;
  goalsCompleted: number;
  goals: GoalItem[];
  sectors: OrgChartSector[];
}

export interface OrgChartNodeData {
  id: string;
  name: string;
  director: string | null;
  isPlaceholder: boolean;
  progress: number;
  goalsCount: number;
  goalsCompleted: number;
  subDepartments: OrgChartSubDept[];
  goals: GoalItem[];
}

interface Props {
  ceo: { name: string | null; isPlaceholder: boolean; progress: number; goalsCount: number; goalsCompleted: number };
  nodes: OrgChartNodeData[];
  scopeId: string;
}

function SectionChip({ label }: { label: string }) {
  return (
    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
      {label}
    </span>
  );
}

function SubDeptCard({ dept, selected, onClick }: { dept: OrgChartSubDept; selected?: boolean; onClick?: () => void }) {
  const pct = Math.max(0, Math.min(100, dept.progress));
  const fillColor = goalColor(pct);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group w-full text-left rounded-xl border bg-white p-3.5 flex flex-col gap-2.5 shadow-sm transition-all
        ${selected ? "ring-2 ring-[#F18213] ring-offset-2 border-border" : "border-border hover:shadow-md hover:-translate-y-0.5"}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-[#364B59]/30 border border-[#364B59]/10 flex items-center justify-center shrink-0">
          <Users2 className="w-4 h-4 text-[#364B59]/60" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#364B59] leading-tight truncate">{dept.name}</p>
          <p className={`text-xs truncate ${dept.director ? "text-[#364B59]/60" : "italic text-[#364B59]/40"}`}>
            {dept.director ?? "Em aberto"}
          </p>
        </div>
        <span className="text-xs font-extrabold tabular-nums shrink-0" style={{ color: fillColor }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: fillColor }}
        />
      </div>
      {dept.sectors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {dept.sectors.map((s) => (
            <span
              key={s.id}
              title={s.responsible ? `Responsável: ${s.responsible}` : "Cargo em aberto"}
              className="text-[10px] bg-[#364B59]/5 border border-[#364B59]/10 px-2 py-0.5 rounded-full text-[#364B59]/60"
            >
              {s.name}
            </span>
          ))}
        </div>
      )}
      <span className="pt-2 mt-0.5 border-t border-[#364B59]/10 flex items-center justify-between text-[11px] font-semibold text-[#364B59]/50 group-hover:text-[#364B59] transition-colors">
        Ver detalhes
        <ChevronRight className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}

export default function OrgChart({ ceo, nodes, scopeId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prevScopeId, setPrevScopeId] = useState(scopeId);

  if (scopeId !== prevScopeId) {
    setPrevScopeId(scopeId);
    setSelectedId(null);
  }

  const scopedNode = scopeId !== "all" ? nodes.find((n) => n.id === scopeId) ?? null : null;

  const detail: NodeDetail | null = (() => {
    if (!selectedId) return null;

    const top = nodes.find((n) => n.id === selectedId);
    if (top) {
      return {
        id: top.id,
        name: top.name,
        director: top.director,
        isPlaceholder: top.isPlaceholder,
        progress: top.progress,
        goalsCount: top.goalsCount,
        goalsCompleted: top.goalsCompleted,
        subDepartments: top.subDepartments.map((s) => ({
          id: s.id,
          name: s.name,
          progress: s.progress,
          responsible: s.director,
          sectors: s.sectors.map((sec) => ({ id: sec.id, name: sec.name, responsible: sec.responsible })),
        })),
        goals: top.goals,
      };
    }

    const sub = scopedNode?.subDepartments.find((s) => s.id === selectedId);
    if (sub) {
      return {
        id: sub.id,
        name: sub.name,
        director: sub.director,
        isPlaceholder: sub.isPlaceholder,
        progress: sub.progress,
        goalsCount: sub.goalsCount,
        goalsCompleted: sub.goalsCompleted,
        subDepartments: sub.sectors.map((sec) => ({
          id: sec.id,
          name: sec.name,
          progress: sec.progress,
          responsible: sec.responsible,
          sectors: [],
        })),
        goals: sub.goals,
      };
    }

    return null;
  })();

  return (
    <div className="overflow-x-auto pb-4 bg-white">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#364B59] px-6 pt-2 mb-1">
        <Network className="w-4 h-4" aria-hidden />
        Organograma
      </h3>
      <div className="flex flex-col items-center px-6 pt-2 gap-0 bg-white w-full">

        {!scopedNode && (
          <>
            {/* ── Seção: CEO ── */}
            <div className="flex flex-col items-center gap-0">
              <SectionChip label="CEO" />
              <div className="h-3 w-px bg-slate-300" />
              <div className="w-full max-w-lg">
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
              {/* Linha horizontal conectando as diretorias — só faz sentido quando o grid exibe uma única linha */}
              <div className="hidden lg:block absolute top-0 left-[10%] right-[10%] h-px bg-slate-400" />

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:pt-8">
                {nodes.map((node) => (
                  <div key={node.id} className="relative flex flex-col items-center">
                    {/* Conector vertical descendo da linha horizontal */}
                    <div className="hidden lg:block absolute -top-8 h-8 w-px bg-slate-400" />
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
          </>
        )}

        {scopedNode && (
          <>
            {/* ── Diretoria ── */}
            <div className="flex flex-col items-center gap-0">
              <SectionChip label="Diretoria" />
              <div className="h-3 w-px bg-slate-300" />
              <div className="w-full max-w-64">
                <OrgNode
                  label={scopedNode.name}
                  subtitle={scopedNode.isPlaceholder ? "Em aberto" : scopedNode.director ?? ""}
                  progress={scopedNode.progress}
                  goalsCount={scopedNode.goalsCount}
                  isPlaceholder={scopedNode.isPlaceholder}
                  selected={selectedId === scopedNode.id}
                  onClick={() => setSelectedId(scopedNode.id)}
                />
              </div>
            </div>

            {/* Conector → seção Gerências */}
            <div className="flex flex-col items-center gap-0">
              <div className="h-4 w-px bg-slate-400" />
              <SectionChip label="Gerências" />
              <div className="h-4 w-px bg-slate-400" />
            </div>

            {/* ── Gerências ── */}
            {scopedNode.subDepartments.length > 0 ? (
              <div className="w-full pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scopedNode.subDepartments.map((dept) => (
                    <SubDeptCard
                      key={dept.id}
                      dept={dept}
                      selected={selectedId === dept.id}
                      onClick={() => setSelectedId(dept.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400 italic">Nenhuma área subordinada cadastrada.</p>
            )}

            <p className="mt-6 text-[10px] text-slate-400 text-center">
              Clique em uma gerência para ver metas detalhadas · Selecione &ldquo;Visão geral&rdquo; para ver toda a empresa
            </p>
          </>
        )}
      </div>

      <NodeDetailSheet node={detail} onClose={() => setSelectedId(null)} />
    </div>
  );
}
