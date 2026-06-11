"use client";

import { useState } from "react";
import { Users2, ChevronRight } from "lucide-react";
import { goalColor, progressBarPct } from "@/lib/utils";
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
    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
      {label}
    </span>
  );
}

function SubDeptCard({ dept, selected, onClick }: { dept: OrgChartSubDept; selected?: boolean; onClick?: () => void }) {
  const pct = dept.progress;
  const fillColor = goalColor(pct);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group w-full text-left rounded-xl border bg-white p-2.5 flex flex-col gap-2 shadow-sm transition-all
        ${selected ? "ring-2 ring-[#F18213] ring-offset-2 border-border" : "border-border hover:shadow-md hover:-translate-y-0.5"}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-[#364B59]/10 border border-[#364B59]/15 flex items-center justify-center shrink-0">
          <Users2 className="w-3.5 h-3.5 text-[#364B59]/75" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#364B59] leading-tight truncate">{dept.name}</p>
          <p className={`text-[11px] truncate ${dept.director ? "font-semibold text-[#364B59]" : "italic text-[#364B59]/65"}`}>
            {dept.director ?? "Em aberto"}
          </p>
        </div>
        <span className="text-[12px] font-extrabold tabular-nums shrink-0" style={{ color: fillColor }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progressBarPct(pct)}%`, backgroundColor: fillColor }}
        />
      </div>
      {dept.sectors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {dept.sectors.map((s) => (
            <span
              key={s.id}
              title={s.responsible ? `Responsável: ${s.responsible}` : "Cargo em aberto"}
              className="text-[10px] bg-[#364B59]/8 border border-[#364B59]/15 px-1.5 py-0.5 rounded-full text-[#364B59]/75 truncate max-w-full"
            >
              {s.name}
            </span>
          ))}
        </div>
      )}
      <span className="pt-1.5 border-t border-[#364B59]/15 flex items-center justify-between text-[11px] font-semibold text-[#364B59]/70 group-hover:text-[#364B59] transition-colors">
        Ver detalhes
        <ChevronRight className="w-3 h-3" />
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

  // Grid das diretorias usa exatamente uma coluna por diretoria em telas largas
  // (até 5), para que os cards cresçam e ocupem toda a largura disponível.
  const DIRECTORATE_LG_COLS: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
  };
  const occupiedColumns = Math.min(Math.max(nodes.length, 1), 5);
  const directorateLgColsClass = DIRECTORATE_LG_COLS[occupiedColumns];

  // Linha horizontal das diretorias vai do centro do primeiro ao centro do
  // último card, proporcional ao número de colunas ocupadas.
  const directorateLinePct = (0.5 / occupiedColumns) * 100;

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
      <div className="flex flex-col items-center px-6 pt-2 gap-0 bg-white w-full">

        {!scopedNode && (
          <>
            {/* ── Seção: CEO ── */}
            <div className="flex flex-col items-center gap-0">
              <SectionChip label="CEO" />
              <div className="h-3 w-px bg-slate-300" />
              <div className="w-full max-w-2xl">
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
              <div
                className="hidden lg:block absolute top-0 h-px bg-slate-400"
                style={{ left: `${directorateLinePct}%`, right: `${directorateLinePct}%` }}
              />

              <div className={`grid grid-cols-2 sm:grid-cols-3 ${directorateLgColsClass} gap-4 lg:pt-8`}>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

            <p className="mt-6 text-[11px] text-slate-400 text-center">
              Clique em uma gerência para ver metas detalhadas · Selecione &ldquo;Visão geral&rdquo; para ver toda a empresa
            </p>
          </>
        )}
      </div>

      <NodeDetailSheet node={detail} onClose={() => setSelectedId(null)} />
    </div>
  );
}
