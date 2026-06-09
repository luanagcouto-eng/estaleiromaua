"use client";

import { goalColor } from "@/lib/utils";

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

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-2xl border text-left shadow-sm transition-all
        ${isCeo ? "border-[#364B59]/30" : "border-border"}
        ${selected ? "ring-2 ring-[#F18213] ring-offset-2" : "hover:shadow-md hover:-translate-y-0.5"}
        ${isPlaceholder ? "opacity-60" : ""}
        bg-white`}
      aria-pressed={selected}
    >
      {/* Colored top accent bar */}
      <span
        aria-hidden="true"
        className="absolute top-0 inset-x-0 h-1"
        style={{ backgroundColor: fillColor }}
      />

      <span className="relative flex flex-col gap-1 px-4 pt-4 pb-3.5">
        {/* Role label */}
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#364B59]/50">
          {isCeo ? "Presidência" : "Diretoria"}
        </span>

        {/* Name */}
        <span className="text-sm font-bold leading-tight text-[#364B59]">{label}</span>

        {/* Director / subtitle */}
        <span
          className={`text-xs truncate ${
            isPlaceholder ? "italic text-[#364B59]/40" : "text-[#364B59]/60"
          }`}
        >
          {subtitle}
        </span>

        {/* Progress section */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#364B59]/40">
              Progresso
            </span>
            <span
              className="text-sm font-extrabold tabular-nums"
              style={{ color: fillColor }}
            >
              {pct.toFixed(0)}%
            </span>
          </div>
          {/* Explicit progress bar */}
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
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
      </span>
    </button>
  );
}
