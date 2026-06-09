"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import UserEditDialog   from "./user-edit-dialog";
import UserCreateDialog from "./user-create-dialog";

interface Profile    { id: string; name: string; email: string; }
interface Department { id: string; name: string; sector: string; }
interface UserRow extends Profile {
  role:          string;
  department_id: string | null;
  superior_id:   string | null;
  is_placeholder?: boolean;
  department:    Department | null;
  superior:      Profile | null;
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
  const [editUser,     setEditUser]     = useState<UserRow | null>(null);
  const [editOpen,     setEditOpen]     = useState(false);
  const [createOpen,   setCreateOpen]   = useState(false);

  function openEdit(u: UserRow) { setEditUser(u); setEditOpen(true); }

  const realUsers        = users.filter((u) => !u.is_placeholder);
  const placeholderUsers = users.filter((u) =>  u.is_placeholder);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {realUsers.length} usuário{realUsers.length !== 1 ? "s" : ""} ativo{realUsers.length !== 1 ? "s" : ""}
          {placeholderUsers.length > 0 && (
            <span className="ml-2 text-amber-600">
              · {placeholderUsers.length} aguardando primeiro login
            </span>
          )}
        </p>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="bg-[#364B59] hover:bg-[#2D3F4A] text-white"
        >
          + Novo Usuário
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface">
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="text-center">Role</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Superior</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10 text-sm">
                  Nenhum usuário cadastrado. Clique em &ldquo;+ Novo Usuário&rdquo; para adicionar.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-surface/50">
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGES[u.role] ?? "bg-gray-100"}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {u.department?.name ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {u.superior?.name ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {u.is_placeholder ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        Pendente login
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Ativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 px-2"
                      onClick={() => openEdit(u)}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={editUser}
        allProfiles={allProfiles}
        departments={departments}
      />

      <UserCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        allProfiles={allProfiles}
        departments={departments}
      />
    </div>
  );
}
