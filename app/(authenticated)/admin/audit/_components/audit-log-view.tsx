"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AuditLogRow } from "../page";

const ACTION_STYLE: Record<string, string> = {
  INSERT: "bg-green-50 text-green-700 border border-green-200",
  UPDATE: "bg-blue-50 text-blue-700 border border-blue-200",
  DELETE: "bg-red-50 text-red-700 border border-red-200",
};

const ENTITY_LABELS: Record<string, string> = {
  goal: "Meta",
  goal_history: "Lançamento",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function ValueCell({ label, value }: { label: string; value: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  const preview = (value as Record<string, unknown>).title
    ? String((value as Record<string, unknown>).title)
    : "ver dados";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-[#364B59] hover:underline"
      >
        {open ? "Ocultar" : preview}
      </button>
      {open && (
        <pre className="mt-1 text-[10px] bg-gray-50 border border-border rounded p-2 max-w-xs overflow-auto max-h-32 text-gray-700">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AuditLogView({ rows }: { rows: AuditLogRow[] }) {
  const [filter, setFilter] = useState<"all" | "goal" | "goal_history">("all");

  const filtered = filter === "all" ? rows : rows.filter((r) => r.entity_type === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 bg-white border border-border rounded-lg p-1 w-fit">
        {(["all", "goal", "goal_history"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === f
                ? "bg-[#364B59] text-white font-medium"
                : "text-muted-foreground hover:text-[#364B59] hover:bg-surface"
            }`}
          >
            {f === "all" ? "Todos" : ENTITY_LABELS[f]}
          </button>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Nenhum evento registrado ainda. Edições em metas e lançamentos aparecerão aqui automaticamente.
        </p>
      )}

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface">
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead className="text-center">Entidade</TableHead>
              <TableHead className="text-center">Ação</TableHead>
              <TableHead>Antes</TableHead>
              <TableHead>Depois</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10 text-sm">
                  Nenhum evento encontrado para este filtro.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id} className="hover:bg-surface/50 align-top">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{row.user_name}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {ENTITY_LABELS[row.entity_type] ?? row.entity_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_STYLE[row.action] ?? ""}`}>
                      {row.action === "INSERT" ? "Criação" : row.action === "UPDATE" ? "Edição" : "Exclusão"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ValueCell label="Antes" value={row.old_value as Record<string, unknown> | null} />
                  </TableCell>
                  <TableCell>
                    <ValueCell label="Depois" value={row.new_value as Record<string, unknown> | null} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
