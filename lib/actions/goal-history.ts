"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { buildGoalEntrySchema } from "@/lib/schemas/goal-entry";

export async function createGoalEntry(goalId: string, raw: unknown) {
  const supabase = await createClient();

  const { data: goal } = await supabase
    .from("goals")
    .select("target_value")
    .eq("id", goalId)
    .single();
  if (!goal) return { error: { _root: ["Meta não encontrada."] } };

  const parsed = buildGoalEntrySchema(Number(goal.target_value)).safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { _root: ["Sessão expirada. Faça login novamente."] } };

  const {
    value, period, data_source, criteria, formula_used, evidence_url,
    justification, five_whys, action_plan,
  } = parsed.data;

  const exceedsTarget = value > Number(goal.target_value);

  const { error: historyError } = await supabase.from("goal_history").insert({
    goal_id: goalId,
    value,
    period,
    data_source,
    criteria,
    formula_used,
    evidence_url: evidence_url ? [evidence_url] : null,
    justification: exceedsTarget ? justification : null,
    five_whys: exceedsTarget ? five_whys : null,
    action_plan: exceedsTarget ? action_plan : null,
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
