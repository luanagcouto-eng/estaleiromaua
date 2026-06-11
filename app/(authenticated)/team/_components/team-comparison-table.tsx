"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { goalTextClass } from "@/lib/utils";
import type { TeamMemberData } from "./team-member-card";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

type SortKey = "name" | "consolidatedPct" | "goals";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <span className="ml-1 text-muted-foreground opacity-40">↕</span>;
  return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

export default function TeamComparisonTable({ members }: { members: TeamMemberData[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("consolidatedPct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...members].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") return dir * a.name.localeCompare(b.name, "pt-BR");
    if (sortKey === "goals") return dir * (a.goals.length - b.goals.length);
    return dir * (a.consolidatedPct - b.consolidatedPct);
  });

  const best = sorted.reduce((m, c) => (c.consolidatedPct > m.consolidatedPct ? c : m), sorted[0]);

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-surface flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#364B59]">Comparativo da Equipe</h2>
        {best && (
          <span className="text-xs text-muted-foreground">
            Melhor desempenho: <span className="font-medium text-[#364B59]">{best.name.split(" ")[0]}</span> ({best.consolidatedPct}%)
          </span>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-surface/50">
            <TableHead>
              <button type="button" onClick={() => toggleSort("name")} className="flex items-center text-xs font-semibold uppercase tracking-wide">
                Colaborador<SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
              </button>
            </TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead className="text-center">
              <button type="button" onClick={() => toggleSort("goals")} className="flex items-center justify-center text-xs font-semibold uppercase tracking-wide w-full">
                Metas<SortIcon col="goals" sortKey={sortKey} sortDir={sortDir} />
              </button>
            </TableHead>
            <TableHead className="text-center">Pendentes</TableHead>
            <TableHead className="text-center">
              <button type="button" onClick={() => toggleSort("consolidatedPct")} className="flex items-center justify-center text-xs font-semibold uppercase tracking-wide w-full">
                Consolidado<SortIcon col="consolidatedPct" sortKey={sortKey} sortDir={sortDir} />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((m) => {
            const pending = m.goals.filter((g) => !g.has_history).length;
            return (
              <TableRow key={m.id} className="hover:bg-surface/40">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
                      <AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{m.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {m.departmentName ?? "—"}
                </TableCell>
                <TableCell className="text-center text-sm">{m.goals.length}</TableCell>
                <TableCell className="text-center">
                  {pending > 0 ? (
                    <span className="text-xs font-medium text-[#F18213] bg-[#FEF0DC] px-2 py-0.5 rounded-full">
                      {pending}
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">✓</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${goalTextClass(m.consolidatedPct)}`}>
                    {m.consolidatedPct}%{m.consolidatedPct >= 90 && m.consolidatedPct < 100 ? " 🏆" : ""}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
