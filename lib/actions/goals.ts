"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { goalSchema } from "@/lib/schemas/goal";

export async function createGoal(raw: unknown) {
  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.from("goals").insert(parsed.data);

  if (error) return { error: { _root: [error.message] } };

  revalidatePath("/admin/goals");
  return { success: true };
}

export async function updateGoal(id: string, raw: unknown) {
  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { error: { _root: [error.message] } };

  revalidatePath("/admin/goals");
  revalidatePath("/my-goals");
  return { success: true };
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/goals");
  revalidatePath("/my-goals");
  return { success: true };
}

export async function getGoalsWithWeightSummary(ownerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("weight")
    .eq("owner_id", ownerId)
    .eq("period", "2026-ANUAL");

  const total = (data ?? []).reduce((sum, g) => sum + Number(g.weight), 0);
  return { totalWeight: total };
}
