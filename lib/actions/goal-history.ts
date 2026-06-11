"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { buildGoalEntrySchema } from "@/lib/schemas/goal-entry";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function syncCurrentValue(supabase: SupabaseClient, goalId: string) {
  const { data: latest } = await supabase
    .from("goal_history")
    .select("value")
    .eq("goal_id", goalId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("goals").update({ current_value: latest?.value ?? 0 }).eq("id", goalId);
}

function revalidateAll() {
  revalidatePath("/my-goals");
  revalidatePath("/team");
  revalidatePath("/overview");
}

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
    value, period, data_source, criteria, formula_used, notes, evidence_url,
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
    notes: notes || null,
    evidence_url: evidence_url ? [evidence_url] : null,
    justification: exceedsTarget ? justification : null,
    five_whys: exceedsTarget ? five_whys : null,
    action_plan: exceedsTarget ? action_plan : null,
    recorded_by: user.id,
  });
  if (historyError) return { error: { _root: [historyError.message] } };

  await syncCurrentValue(supabase, goalId);

  revalidateAll();
  return { success: true };
}

export async function updateGoalEntry(entryId: string, raw: unknown) {
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("goal_history")
    .select("goal_id")
    .eq("id", entryId)
    .single();
  if (!entry) return { error: { _root: ["Lançamento não encontrado."] } };

  const { data: goal } = await supabase
    .from("goals")
    .select("target_value")
    .eq("id", entry.goal_id)
    .single();
  if (!goal) return { error: { _root: ["Meta não encontrada."] } };

  const parsed = buildGoalEntrySchema(Number(goal.target_value)).safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const {
    value, period, data_source, criteria, formula_used, notes, evidence_url,
    justification, five_whys, action_plan,
  } = parsed.data;

  const exceedsTarget = value > Number(goal.target_value);

  const { error: updateError } = await supabase
    .from("goal_history")
    .update({
      value,
      period,
      data_source,
      criteria,
      formula_used,
      notes: notes || null,
      evidence_url: evidence_url ? [evidence_url] : null,
      justification: exceedsTarget ? justification : null,
      five_whys: exceedsTarget ? five_whys : null,
      action_plan: exceedsTarget ? action_plan : null,
    })
    .eq("id", entryId);
  if (updateError) return { error: { _root: [updateError.message] } };

  await syncCurrentValue(supabase, entry.goal_id);

  revalidateAll();
  return { success: true };
}

export async function deleteGoalEntry(entryId: string) {
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("goal_history")
    .select("goal_id")
    .eq("id", entryId)
    .single();
  if (!entry) return { error: { _root: ["Lançamento não encontrado."] } };

  const { error: deleteError } = await supabase.from("goal_history").delete().eq("id", entryId);
  if (deleteError) return { error: { _root: [deleteError.message] } };

  await syncCurrentValue(supabase, entry.goal_id);

  revalidateAll();
  return { success: true };
}
