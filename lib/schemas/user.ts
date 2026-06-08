import { z } from "zod";

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100),
  role: z.enum(["ceo", "director", "manager", "admin"]),
  department_id: z.string().uuid().nullable().optional(),
  superior_id: z.string().uuid().nullable().optional(),
});

export type UserUpdateValues = z.infer<typeof userUpdateSchema>;
