import { z } from "zod";

export const goalEntrySchema = z.object({
  value: z
    .number("Informe um número válido")
    .min(0, "Valor não pode ser negativo"),
  notes: z
    .string()
    .min(10, "Descreva a memória de cálculo (mínimo 10 caracteres)")
    .max(1000, "Máximo 1000 caracteres"),
  evidence_url: z
    .string()
    .url("Informe uma URL válida (ex: link para planilha, documento ou print)")
    .optional()
    .or(z.literal("")),
});

export type GoalEntryFormValues = z.infer<typeof goalEntrySchema>;
