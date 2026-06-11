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

/** Símbolo do operador definido na criação da meta (>=, <=, etc.) */
export const OP_SYMBOL: Record<string, string> = { ">=": "≥", ">": ">", "<=": "≤", "<": "<", "=": "=" };

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

/**
 * Calcula o percentual de atingimento de uma meta, considerando o operador (>=, <=, etc.)
 * e se já houve algum lançamento (goal_history). Sem lançamento, retorna 0% — caso
 * contrário, current_value=0 (padrão do banco) produziria 200% para metas <=/<,
 * passando a impressão de uma meta cumprida sem nenhum resultado reportado.
 * Para metas "menor ou igual" (≤ / <), usa Atingimento = 1 + (Meta − Realizado) / Meta,
 * de forma que resultados piores que a meta fiquem abaixo de 100%. O valor retornado
 * não é limitado: pode ser negativo ou maior que 100%.
 */
export function calcProgress(current: number, target: number, operator?: string, hasHistory: boolean = true): number {
  if (!hasHistory || target === 0) return 0;
  if (operator === "<=" || operator === "<") {
    return Math.round((1 + (target - current) / target) * 100);
  }
  return Math.round((current / target) * 100);
}

/** Limita um percentual de atingimento a [0, 100] para uso na largura de barras de progresso */
export function progressBarPct(pct: number): number {
  return Math.max(0, Math.min(100, pct));
}

/** Resolve o rótulo de exibição de um Select a partir do id selecionado */
export function labelFromOptions(
  value: string | undefined,
  options: { id: string; name: string }[],
  fallback: string
): string {
  return options.find((o) => o.id === value)?.name ?? fallback;
}
