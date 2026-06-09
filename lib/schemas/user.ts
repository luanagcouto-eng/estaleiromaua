import { z } from "zod";

// Aceita qualquer string no formato UUID (8-4-4-4-12 hex), sem verificar bits de versão/variante.
// Necessário porque IDs de placeholder e departamentos foram inseridos manualmente com UUIDs não-padrão.
const flexUuid = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "ID inválido");

export const userUpdateSchema = z.object({
  name:            z.string().min(2, "Mínimo 2 caracteres").max(100),
  role:            z.enum(["ceo", "director", "manager", "admin"]),
  department_ids:  flexUuid.array().optional(),
  superior_id:     flexUuid.nullable().optional(),
});

export const userCreateSchema = z.object({
  name:            z.string().min(2, "Mínimo 2 caracteres").max(100),
  email:           z.string().email("E-mail inválido"),
  role:            z.enum(["ceo", "director", "manager", "admin"]),
  department_ids:  flexUuid.array().optional(),
  superior_id:     flexUuid.nullable().optional(),
});

export type UserUpdateValues = z.infer<typeof userUpdateSchema>;
export type UserCreateValues = z.infer<typeof userCreateSchema>;
