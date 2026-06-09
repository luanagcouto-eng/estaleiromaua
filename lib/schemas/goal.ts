import { z } from "zod";

export const goalSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres").max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  period: z.enum(["2026-ANUAL", "2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"]),
  weight: z
    .number("Informe um número válido")
    .min(0.1, "Peso mínimo 0,1")
    .max(100, "Peso máximo 100"),
  target_value: z
    .number("Informe um número válido")
    .min(0.01, "Meta deve ser maior que zero"),
  unit: z.enum(["%", "R$", "dias", "unidades", "pontos", "horas"]),
  owner_id: z.string().uuid("Selecione um responsável"),
  department_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Selecione um departamento"),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
