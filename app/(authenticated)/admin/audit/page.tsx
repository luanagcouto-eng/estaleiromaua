import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AuditLogView from "./_components/audit-log-view";

export const metadata = { title: "Auditoria — Metas Mauá 2026" };

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  user_name: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export default async function AuditPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "ceo") redirect("/my-goals");

  const { data: logs } = await supabase
    .from("audit_log")
    .select("id, user_id, entity_type, entity_id, action, old_value, new_value, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const userIds = [...new Set((logs ?? []).map((l) => l.user_id).filter(Boolean))] as string[];
  let nameMap: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);
    nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.name]));
  }

  const rows: AuditLogRow[] = (logs ?? []).map((l) => ({
    ...l,
    user_name: l.user_id ? (nameMap[l.user_id] ?? "Usuário removido") : "Sistema",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#364B59]">Trilha de Auditoria</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Histórico de criações, edições e exclusões nas metas e lançamentos
        </p>
      </div>
      <AuditLogView rows={rows} />
    </div>
  );
}
