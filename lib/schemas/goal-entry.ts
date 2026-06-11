import { z } from "zod";

export const GOAL_PERIODS = ["2026-ANUAL", "2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"] as const;

export const goalEntryBaseSchema = z.object({
  period: z.enum(GOAL_PERIODS, { error: "Selecione o período de referência" }),
  value: z
    .number("Informe um número válido")
    .min(0, "Valor não pode ser negativo"),
  data_source: z
    .string()
    .min(3, "Informe a fonte dos dados (mínimo 3 caracteres)")
    .max(500, "Máximo 500 caracteres"),
  criteria: z
    .string()
    .min(3, "Informe o critério utilizado (mínimo 3 caracteres)")
    .max(500, "Máximo 500 caracteres"),
  formula_used: z
    .string()
    .min(3, "Informe a fórmula utilizada (mínimo 3 caracteres)")
    .max(500, "Máximo 500 caracteres"),
  evidence_url: z
    .string()
    .min(1, "Evidência obrigatória — anexe um arquivo ou cole uma URL")
    .url("URL inválida. Faça upload de um arquivo ou cole um link válido (https://...)"),
  justification: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  five_whys: z.array(z.string().max(300, "Máximo 300 caracteres")).length(5).optional(),
  action_plan: z.string().max(1000, "Máximo 1000 caracteres").optional(),
});

export type GoalEntryFormValues = z.infer<typeof goalEntryBaseSchema>;

export const goalEntrySchema = goalEntryBaseSchema;

/** Quando o valor lançado ultrapassa a meta, exige justificativa e plano de ação. */
export function buildGoalEntrySchema(targetValue: number) {
  return goalEntryBaseSchema.superRefine((data, ctx) => {
    if (data.value > targetValue) {
      if (!data.justification || data.justification.trim().length < 10) {
        ctx.addIssue({
          code: "custom",
          path: ["justification"],
          message: "Justifique por que o valor ultrapassou a meta (mínimo 10 caracteres)",
        });
      }
      if (!data.action_plan || data.action_plan.trim().length < 10) {
        ctx.addIssue({
          code: "custom",
          path: ["action_plan"],
          message: "Descreva o plano de ação para corrigir o desvio (mínimo 10 caracteres)",
        });
      }
    }
  });
}
