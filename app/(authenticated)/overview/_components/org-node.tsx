"use client";

import { goalColor } from "@/lib/utils";

interface OrgNodeProps {
  label: string;
  subtitle: string;
  progress: number;
  isPlaceholder?: boolean;
  isCeo?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"
        stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
      />
      <path d="M7 5H4v1a4 4 0 0 0 4 4M17 5h3v1a4 4 0 0 1-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 12v3M9 19h6M9.5 19c0-1.5.5-2.5 2.5-2.5s2.5 1 2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function OrgNode({ label, subtitle, progress, isPlaceholder, isCeo, selected, onClick }: OrgNodeProps) {
  const pct = Math.max(0, Math.min(100, progress));
  const fillColor = goalColor(pct);
  const isFull = pct >= 90;

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
      {/* Fill gamificado — sobe de baixo para cima conforme o percentual */}
      <span
        aria-hidden="true"
        className="absolute inset-0 transition-[clip-path] duration-700 ease-out"
        style={{
          backgroundColor: fillColor,
          clipPath: `inset(${100 - pct}% 0 0 0)`,
          opacity: isFull ? 1 : 0.85,
        }}
      />

      <span className="relative flex flex-col gap-1 px-4 py-3.5">
        <span className="flex items-center justify-between gap-2">
          <span className={`text-[11px] font-semibold uppercase tracking-wide ${pct >= 61 ? "text-white/80" : "text-muted"}`}>
            {isCeo ? "CEO" : "Diretoria"}
          </span>
          {isFull && (
            <TrophyIcon className={`h-4 w-4 ${pct >= 61 ? "text-white" : "text-[#364B59]"}`} />
          )}
        </span>

        <span className={`text-sm font-bold leading-tight ${pct >= 61 ? "text-white" : "text-[#364B59]"}`}>
          {label}
        </span>

        <span className={`text-xs ${pct >= 61 ? "text-white/85" : "text-muted"} ${isPlaceholder ? "italic" : ""}`}>
          {subtitle}
        </span>

        <span className={`mt-1.5 text-xl font-extrabold tabular-nums ${pct >= 61 ? "text-white" : "text-[#364B59]"}`}>
          {pct.toFixed(0)}%
        </span>
      </span>
    </button>
  );
}
