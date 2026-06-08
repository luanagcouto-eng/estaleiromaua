"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { goalEntrySchema } from "@/lib/schemas/goal-entry";

export async function createGoalEntry(goalId: string, raw: unknown) {
  const parsed = goalEntrySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _root: ["Sessão expirada. Faça login novamente."] } };

  const { value, notes, evidence_url } = parsed.data;

  const { error: historyError } = await supabase.from("goal_history").insert({
    goal_id: goalId,
    value,
    notes,
    evidence_url: evidence_url ? [evidence_url] : null,
    recorded_by: user.id,
  });
  if (historyError) return { error: { _root: [historyError.message] } };

  const { error: goalError } = await supabase
    .from("goals")
    .update({ current_value: value })
    .eq("id", goalId);
  if (goalError) return { error: { _root: [goalError.message] } };

  revalidatePath("/my-goals");
  revalidatePath("/team");
  revalidatePath("/overview");
  return { success: true };
}
