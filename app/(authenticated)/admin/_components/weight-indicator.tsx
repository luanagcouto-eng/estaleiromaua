"use client";

import { cn } from "@/lib/utils";

interface WeightIndicatorProps {
  used: number;
  adding?: number;
}

export default function WeightIndicator({ used, adding = 0 }: WeightIndicatorProps) {
  const total = Math.min(used + adding, 100);
  const over = used + adding > 100;
  const remaining = 100 - used;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground">Peso total utilizado</span>
        <span className={cn(over ? "text-red-500" : used === 100 ? "text-[#364B59]" : "text-[#F18213]")}>
          {(used + adding).toFixed(1)}% / 100%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            over ? "bg-red-500" : total >= 100 ? "bg-[#364B59]" : "bg-[#F18213]"
          )}
          style={{ width: `${total}%` }}
        />
      </div>
      {over ? (
        <p className="text-xs text-red-500">Limite de 100% excedido em {(used + adding - 100).toFixed(1)}%</p>
      ) : (
        <p className="text-xs text-muted-foreground">Disponível: {remaining.toFixed(1)}%</p>
      )}
    </div>
  );
}
