"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import UserEditDialog   from "./user-edit-dialog";
import UserCreateDialog from "./user-create-dialog";
import { deleteUserProfile } from "@/lib/actions/users";

interface Profile    { id: string; name: string; email: string; }
interface Department { id: string; name: string; sector: string; }
interface UserRow extends Profile {
  role:            string;
  department_id:   string | null;
  department_ids?: string[];
  superior_id:     string | null;
  is_placeholder?: boolean;
  avatar_url?:     string | null;
  department:      Department | null;
  superior:        Profile | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
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
  const deptMap = new Map(departments.map((d) => [d.id, d]));
  const [editUser,     setEditUser]     = useState<UserRow | null>(null);
  const [editOpen,     setEditOpen]     = useState(false);
  const [createOpen,   setCreateOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  function openEdit(u: UserRow) { setEditUser(u); setEditOpen(true); }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteUserProfile(deleteTarget.id);
    setDeleting(false);

    if (result?.error) {
      const msg = (result.error as Record<string, string[]>)._root?.[0] ?? "Erro ao excluir usuário.";
      toast.error(msg);
      setDeleteTarget(null);
      return;
    }
    toast.success(`Usuário "${deleteTarget.name}" excluído com sucesso.`);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}
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
            <TableRow className="bg-[#364B59]/20">
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="text-center">Role</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Superior</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
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
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={u.avatar_url ?? undefined} alt={u.name} />
                        <AvatarFallback className="text-[10px] bg-[#364B59] text-white">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      {u.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGES[u.role] ?? "bg-gray-100"}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {(u.department_ids ?? []).length > 0
                      ? (u.department_ids ?? []).map((did) => deptMap.get(did)?.name).filter(Boolean).join(", ")
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {u.superior?.name ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      Ativo
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2"
                        onClick={() => openEdit(u)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Excluir usuário"
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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

      {/* Confirm delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#364B59]">Excluir usuário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir{" "}
            <span className="font-semibold text-text">{deleteTarget?.name}</span>?{" "}
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
