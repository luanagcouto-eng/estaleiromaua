import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AuditLogView from "./_components/audit-log-view";

export const metadata = { title: "Auditoria — Metas Mauá 2026" };

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  timestamp: string;
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
    .select("id, user_id, entity_id, action, old_value, new_value, timestamp")
    .order("timestamp", { ascending: false })
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
    id: l.id,
    user_id: l.user_id ?? null,
    user_name: l.user_id ? (nameMap[l.user_id] ?? "Usuário removido") : "Sistema",
    action: l.action,
    entity_id: l.entity_id ?? null,
    old_value: l.old_value as Record<string, unknown> | null,
    new_value: l.new_value as Record<string, unknown> | null,
    timestamp: l.timestamp,
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
