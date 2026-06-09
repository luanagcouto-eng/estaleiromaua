import { z } from "zod";

export const GOAL_PERIODS = ["2026-ANUAL", "2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"] as const;

export const goalEntrySchema = z.object({
  period: z.enum(GOAL_PERIODS, { error: "Selecione o período de referência" }),
  value: z
    .number("Informe um número válido")
    .min(0, "Valor não pode ser negativo"),
  notes: z
    .string()
    .min(10, "Descreva a memória de cálculo (mínimo 10 caracteres)")
    .max(1000, "Máximo 1000 caracteres"),
  evidence_url: z
    .string()
    .min(1, "Evidência obrigatória — anexe um arquivo ou cole uma URL")
    .url("URL inválida. Faça upload de um arquivo ou cole um link válido (https://...)"),
});

export type GoalEntryFormValues = z.infer<typeof goalEntrySchema>;
