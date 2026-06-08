"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { userUpdateSchema, type UserUpdateValues } from "@/lib/schemas/user";
import { updateUserProfile } from "@/lib/actions/users";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Profile    { id: string; name: string; email: string; }
interface Department { id: string; name: string; sector: string; }

interface UserRow extends Profile {
  role: string;
  department_id: string | null;
  superior_id: string | null;
  department: Department | null;
  superior: Profile | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserRow | null;
  allProfiles: Profile[];
  departments: Department[];
}

const ROLE_LABELS = { ceo: "CEO", director: "Diretor(a)", manager: "Gestor(a)", admin: "Administrador" };

export default function UserEditDialog({ open, onClose, user, allProfiles, departments }: Props) {
  const [pending, setPending] = useState(false);

  const form = useForm<UserUpdateValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      name: user?.name ?? "",
      role: (user?.role as UserUpdateValues["role"]) ?? "manager",
      department_id: user?.department_id ?? null,
      superior_id: user?.superior_id ?? null,
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        name: user.name,
        role: user.role as UserUpdateValues["role"],
        department_id: user.department_id,
        superior_id: user.superior_id,
      });
    }
  }, [user, open, form]);

  async function onSubmit(values: UserUpdateValues) {
    if (!user) return;
    setPending(true);
    const result = await updateUserProfile(user.id, values);
    setPending(false);

    if (result?.error) { toast.error("Erro ao atualizar usuário."); return; }
    toast.success("Usuário atualizado!");
    onClose();
  }

  const superiorOptions = allProfiles.filter(p => p.id !== user?.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#364B59]">Editar Usuário</DialogTitle>
          {user && <p className="text-sm text-muted">{user.email}</p>}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Papel (Role)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="department_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento</FormLabel>
                <Select onValueChange={v => field.onChange(v === "none" ? null : v)} value={field.value ?? "none"}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Sem departamento" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sem departamento</SelectItem>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="superior_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Superior imediato</FormLabel>
                <Select onValueChange={v => field.onChange(v === "none" ? null : v)} value={field.value ?? "none"}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Sem superior" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sem superior</SelectItem>
                    {superiorOptions.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={pending} className="bg-[#364B59] hover:bg-[#2D3F4A] text-white">
                {pending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
