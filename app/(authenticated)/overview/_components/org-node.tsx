"use client";

import { UserCircle2, ChevronRight, Handshake, Cog, HardHat, Banknote, ShieldCheck, Building2 } from "lucide-react";
import { goalColor } from "@/lib/utils";

const DIRECTORATE_ICONS: Record<string, typeof Building2> = {
  "Diretoria Comercial":     Handshake,
  "Diretoria de Operações":  Cog,
  "Diretoria RH / QSMS":     HardHat,
  "Gerência Financeiro":     Banknote,
  "Gerência GGCQ":           ShieldCheck,
};

interface OrgNodeProps {
  label: string;
  subtitle: string;
  progress: number;
  goalsCount?: number;
  isPlaceholder?: boolean;
  isCeo?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export default function OrgNode({
  label,
  subtitle,
  progress,
  goalsCount,
  isPlaceholder,
  isCeo,
  selected,
  onClick,
}: OrgNodeProps) {
  const pct = Math.max(0, Math.min(100, progress));
  const fillColor = goalColor(pct);
  const Icon = isCeo ? UserCircle2 : (DIRECTORATE_ICONS[label] ?? Building2);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full rounded-2xl border text-left shadow-sm transition-all
        ${isCeo ? "border-[#364B59]/30" : "border-border"}
        ${selected ? "ring-2 ring-[#F18213] ring-offset-2" : "hover:shadow-md hover:-translate-y-0.5"}
        bg-white`}
      aria-pressed={selected}
    >
      <span className={`relative flex flex-col ${isCeo ? "gap-1.5 px-6 pt-6 pb-5" : "gap-1 px-4 pt-4 pb-3.5"}`}>
        {/* Avatar circle + role label */}
        <span className="flex items-center gap-2.5 mb-0.5">
          <span className={`rounded-full bg-[#364B59]/10 border border-[#364B59]/10 flex items-center justify-center shrink-0 ${isCeo ? "w-12 h-12" : "w-9 h-9"}`}>
            <Icon className={isCeo ? "w-6 h-6 text-[#364B59]/60" : "w-5 h-5 text-[#364B59]/60"} aria-hidden />
          </span>
          <span className={`font-bold uppercase tracking-widest ${isCeo ? "text-xs text-[#364B59]/50" : "text-[10px] text-[#364B59]"}`}>
            {isCeo ? "CEO" : label}
          </span>
        </span>

        {/* Name — only the CEO card needs this (the tag above already shows the directorate name) */}
        {isCeo && (
          <span className="text-lg font-bold leading-tight text-[#364B59]">{label}</span>
        )}

        {/* Director / subtitle */}
        <span
          className={`truncate ${isCeo ? "text-sm" : "text-xs"} ${
            isPlaceholder ? "italic text-[#364B59]/40" : "text-[#364B59]/60"
          }`}
        >
          {subtitle}
        </span>

        {/* Progress section */}
        <div className={isCeo ? "mt-4 space-y-2" : "mt-3 space-y-1.5"}>
          <div className="flex items-center justify-between">
            <span className={`font-semibold uppercase tracking-wide text-[#364B59]/40 ${isCeo ? "text-xs" : "text-[10px]"}`}>
              Progresso
            </span>
            <span
              className={`font-extrabold tabular-nums ${isCeo ? "text-xl" : "text-sm"}`}
              style={{ color: fillColor }}
            >
              {pct.toFixed(0)}%
            </span>
          </div>
          {/* Explicit progress bar */}
          <div className={`rounded-full bg-gray-100 overflow-hidden ${isCeo ? "h-3" : "h-2"}`}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: fillColor }}
            />
          </div>
        </div>

        {/* Goals count */}
        {goalsCount !== undefined && goalsCount > 0 && (
          <span className="mt-1 text-[10px] text-[#364B59]/40">
            {goalsCount} meta{goalsCount !== 1 ? "s" : ""}
          </span>
        )}

        {/* "Ver detalhes" CTA — only for directorate cards */}
        {!isCeo && (
          <span className="mt-2 pt-2.5 border-t border-[#364B59]/10 flex items-center justify-between text-[11px] font-semibold text-[#364B59]/50 group-hover:text-[#364B59] transition-colors">
            Ver detalhes
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </span>
    </button>
  );
}
