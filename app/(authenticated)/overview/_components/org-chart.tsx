"use client";

import { useState } from "react";
import { Users2 } from "lucide-react";
import { goalColor } from "@/lib/utils";
import OrgNode from "./org-node";
import NodeDetailSheet, { type NodeDetail } from "./node-detail-sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface GoalItem {
  id: string;
  title: string;
  period: string;
  progress: number;
  current_value: number;
  target_value: number;
  unit: string;
}

export interface OrgChartSector {
  id: string;
  name: string;
  responsible: string | null;
}

export interface OrgChartSubDept {
  id: string;
  name: string;
  progress: number;
  responsible: string | null;
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
}

function SectionChip({ label }: { label: string }) {
  return (
    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
      {label}
    </span>
  );
}

function SubDeptCard({ dept }: { dept: OrgChartSubDept }) {
  const pct = Math.max(0, Math.min(100, dept.progress));
  const fillColor = goalColor(pct);

  return (
    <div className="rounded-xl border border-border bg-white p-3.5 flex flex-col gap-2.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-[#364B59]/10 border border-[#364B59]/10 flex items-center justify-center shrink-0">
          <Users2 className="w-4 h-4 text-[#364B59]/60" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#364B59] leading-tight truncate">{dept.name}</p>
          <p className={`text-xs truncate ${dept.responsible ? "text-[#364B59]/60" : "italic text-[#364B59]/40"}`}>
            {dept.responsible ?? "Em aberto"}
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
    </div>
  );
}

export default function OrgChart({ ceo, nodes, directorateOptions, canCustomize, defaultScopeId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scopeId, setScopeId] = useState<string>(defaultScopeId ?? "all");

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;
  const scopedNode = scopeId !== "all" ? nodes.find((n) => n.id === scopeId) ?? null : null;

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
    <div className="overflow-x-auto pb-4 bg-white">
      <div className="min-w-[920px] flex flex-col items-center px-6 pt-2 gap-0 bg-white">

        {/* Controle de customização (Admin/Diretor) */}
        {canCustomize && (
          <div className="w-full flex justify-end mb-4">
            <Select value={scopeId} onValueChange={(v) => { setScopeId(v ?? "all"); setSelectedId(null); }}>
              <SelectTrigger size="sm" className="bg-white">
                <SelectValue placeholder="Visão geral" />
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

        {!scopedNode && (
          <>
            {/* ── Seção: CEO ── */}
            <div className="flex flex-col items-center gap-0">
              <SectionChip label="CEO" />
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

            <p className="mt-6 text-[10px] text-slate-400 text-center">
              Clique em uma diretoria para ver metas e áreas subordinadas
            </p>
          </>
        )}

        {scopedNode && (
          <>
            {/* ── Nível 1: Diretor ── */}
            <div className="flex flex-col items-center gap-0">
              <SectionChip label="Nível 1 · Diretor" />
              <div className="h-3 w-px bg-slate-300" />
              <div className="w-64">
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
              <SectionChip label="Nível 2 · Gerências" />
              <div className="h-4 w-px bg-slate-400" />
            </div>

            {/* ── Nível 2: Gerências ── */}
            {scopedNode.subDepartments.length > 0 ? (
              <div className="relative w-full">
                <div className="absolute top-0 left-[10%] right-[10%] h-px bg-slate-400" />
                <div className="grid grid-cols-3 gap-4 pt-8">
                  {scopedNode.subDepartments.map((dept) => (
                    <div key={dept.id} className="relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-px bg-slate-400" />
                      <SubDeptCard dept={dept} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-400 italic">Nenhuma área subordinada cadastrada.</p>
            )}

            <p className="mt-6 text-[10px] text-slate-400 text-center">
              Clique na diretoria para ver metas detalhadas · Selecione &ldquo;Visão geral&rdquo; para ver toda a empresa
            </p>
          </>
        )}
      </div>

      <NodeDetailSheet node={detail} onClose={() => setSelectedId(null)} />
    </div>
  );
}
