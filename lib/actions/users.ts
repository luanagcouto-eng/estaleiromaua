"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { userUpdateSchema, userCreateSchema } from "@/lib/schemas/user";

export async function updateUserProfile(id: string, raw: unknown) {
  const parsed = userUpdateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: { _root: [error.message] } };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function createUserProfile(raw: unknown) {
  const parsed = userCreateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").insert({
    ...parsed.data,
    is_placeholder: true,
  });

  if (error) return { error: { _root: [error.message] } };

  revalidatePath("/admin/users");
  return { success: true };
}
