"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { userUpdateSchema, userCreateSchema } from "@/lib/schemas/user";

export async function updateUserProfile(id: string, raw: unknown) {
  const parsed = userUpdateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { department_ids = [], avatar_url, ...rest } = parsed.data;
  const department_id = department_ids.length > 0 ? department_ids[0] : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ...rest, department_id, avatar_url: avatar_url || null })
    .eq("id", id);

  if (error) return { error: { _root: [error.message] } };

  // Sync junction table
  await supabase.from("profile_departments").delete().eq("profile_id", id);
  if (department_ids.length > 0) {
    await supabase.from("profile_departments").insert(
      department_ids.map((did) => ({ profile_id: id, department_id: did }))
    );
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function createUserProfile(raw: unknown) {
  const parsed = userCreateSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { department_ids = [], avatar_url, ...rest } = parsed.data;
  const department_id = department_ids.length > 0 ? department_ids[0] : null;

  const supabase = await createClient();
  const { data: newProfile, error } = await supabase
    .from("profiles")
    .insert({ ...rest, department_id, avatar_url: avatar_url || null, is_placeholder: true })
    .select("id")
    .single();

  if (error) return { error: { _root: [error.message] } };

  if (newProfile && department_ids.length > 0) {
    await supabase.from("profile_departments").insert(
      department_ids.map((did) => ({ profile_id: newProfile.id, department_id: did }))
    );
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUserProfile(id: string) {
  const supabase = await createClient();

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
