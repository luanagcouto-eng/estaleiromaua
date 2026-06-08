"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import UserEditDialog from "./user-edit-dialog";

interface Profile    { id: string; name: string; email: string; }
interface Department { id: string; name: string; sector: string; }
interface UserRow extends Profile {
  role: string;
  department_id: string | null;
  superior_id:   string | null;
  department: Department | null;
  superior:   Profile | null;
}

const ROLE_BADGES: Record<string, string> = {
  ceo:      "bg-[#364B59] text-white",
  director: "bg-[#F18213] text-white",
  manager:  "bg-gray-100 text-gray-700",
  admin:    "bg-purple-100 text-purple-700",
};
const ROLE_LABELS: Record<string, string> = {
  ceo: "CEO", director: "Diretor(a)", manager: "Gestor(a)", admin: "Admin",
};

interface Props { users: UserRow[]; departments: Department[]; allProfiles: Profile[]; }

export default function UsersTable({ users, departments, allProfiles }: Props) {
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function openEdit(u: UserRow) { setSelected(u); setDialogOpen(true); }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}</p>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface">
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="text-center">Role</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Superior</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted py-10">
                  Nenhum usuário. Os colaboradores aparecem aqui após o primeiro login.
                </TableCell>
              </TableRow>
            )}
            {users.map(u => (
              <TableRow key={u.id} className="hover:bg-surface/50">
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-sm text-muted">{u.email}</TableCell>
                <TableCell className="text-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGES[u.role] ?? "bg-gray-100"}`}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{u.department?.name ?? <span className="text-muted">—</span>}</TableCell>
                <TableCell className="text-sm">{u.superior?.name ?? <span className="text-muted">—</span>}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => openEdit(u)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserEditDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        user={selected}
        allProfiles={allProfiles}
        departments={departments}
      />
    </div>
  );
}
