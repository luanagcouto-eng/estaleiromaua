import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Retorna a cor CSS de gamificação com base no percentual (0–100) */
export function goalColor(pct: number): string {
  if (pct >= 90) return "var(--color-goal-full)";
  if (pct >= 61) return "var(--color-goal-high)";
  if (pct >= 31) return "var(--color-goal-mid)";
  if (pct > 0)   return "var(--color-goal-low)";
  return "var(--color-goal-empty)";
}

/** Classe Tailwind de texto conforme percentual (para badges) */
export function goalTextClass(pct: number): string {
  if (pct >= 90) return "text-white bg-[#364B59]";
  if (pct >= 61) return "text-white bg-[#F18213]";
  if (pct >= 31) return "text-gray-800 bg-[#F7A84E]";
  if (pct > 0)   return "text-gray-700 bg-[#FDDCB0]";
  return "text-gray-500 bg-gray-100";
}

/** Formata valor de meta conforme unidade */
export function formatGoalValue(value: number, unit: string): string {
  if (unit === "R$") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (unit === "%") return `${value.toFixed(1)}%`;
  return `${value.toLocaleString("pt-BR")} ${unit}`;
}

/** Calcula o percentual de atingimento de uma meta */
export function calcProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}
