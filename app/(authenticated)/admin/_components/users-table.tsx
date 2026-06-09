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

const MOCK_USERS: UserRow[] = [
  {
    id: "__mock_1", name: "Carlos Mendes", email: "carlos.mendes@estaleiromaua.ind.br", role: "ceo",
    department_id: "__mock", superior_id: null,
    department: { id: "__mock", name: "Diretoria Geral", sector: "" },
    superior: null,
  },
  {
    id: "__mock_2", name: "Ana Rodrigues", email: "ana.rodrigues@estaleiromaua.ind.br", role: "director",
    department_id: "__mock", superior_id: "__mock_1",
    department: { id: "__mock", name: "Produção Naval", sector: "" },
    superior: { id: "__mock_1", name: "Carlos Mendes", email: "" },
  },
  {
    id: "__mock_3", name: "João Silva", email: "joao.silva@estaleiromaua.ind.br", role: "manager",
    department_id: "__mock", superior_id: "__mock_2",
    department: { id: "__mock", name: "Engenharia", sector: "" },
    superior: { id: "__mock_2", name: "Ana Rodrigues", email: "" },
  },
];

export default function UsersTable({ users, departments, allProfiles }: Props) {
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isMock = users.length === 0;
  const displayUsers = isMock ? MOCK_USERS : users;

  function openEdit(u: UserRow) { setSelected(u); setDialogOpen(true); }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {isMock ? "Nenhum usuário cadastrado" : `${users.length} usuário${users.length !== 1 ? "s" : ""} cadastrado${users.length !== 1 ? "s" : ""}`}
      </p>

      {isMock && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Pré-visualização — os dados abaixo são apenas um exemplo. Os colaboradores reais aparecem aqui após o primeiro login.
        </p>
      )}

      <div className={`rounded-xl border border-border bg-white overflow-hidden${isMock ? " opacity-50 pointer-events-none select-none" : ""}`}>
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
            {displayUsers.map(u => (
              <TableRow key={u.id} className="hover:bg-surface/50">
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell className="text-center">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGES[u.role] ?? "bg-gray-100"}`}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{u.department?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-sm">{u.superior?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-right">
                  {!isMock && (
                    <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => openEdit(u)}>
                      Editar
                    </Button>
                  )}
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
