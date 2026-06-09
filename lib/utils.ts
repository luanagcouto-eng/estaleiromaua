import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Retorna a cor CSS de gamificação com base no percentual (0–100) */
export function goalColor(pct: number): string {
  if (pct >= 66) return "var(--color-goal-high)";  // verde
  if (pct >= 33) return "var(--color-goal-mid)";   // amarelo
  return "var(--color-goal-low)";                   // vermelho
}

/** Classe Tailwind de texto conforme percentual (para badges) */
export function goalTextClass(pct: number): string {
  if (pct >= 66) return "text-[#1B5E37] bg-[#9AD595]";  // verde
  if (pct >= 33) return "text-[#7B5800] bg-[#F9E79F]";  // amarelo
  return "text-[#7C2737] bg-[#DFA1AA]";                  // vermelho
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
