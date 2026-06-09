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

export async function deleteUserProfile(id: string) {
  const supabase = await createClient();

  // Block deletion if user has goals assigned
  const { count: goalsCount } = await supabase
    .from("goals")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", id);

  if (goalsCount && goalsCount > 0) {
    return {
      error: {
        _root: [
          `Este usuário possui ${goalsCount} meta(s) atribuída(s). Reatribua ou remova as metas antes de excluir.`,
        ],
      },
    };
  }

  // Block deletion if user is superior of other profiles
  const { count: subCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("superior_id", id);

  if (subCount && subCount > 0) {
    return {
      error: {
        _root: [
          `Este usuário é superior direto de ${subCount} colaborador(es). Atualize a hierarquia antes de excluir.`,
        ],
      },
    };
  }

  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) return { error: { _root: [error.message] } };

  revalidatePath("/admin/users");
  return { success: true };
}
