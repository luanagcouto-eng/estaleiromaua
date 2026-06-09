"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { userCreateSchema, type UserCreateValues } from "@/lib/schemas/user";
import { createUserProfile } from "@/lib/actions/users";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Profile    { id: string; name: string; email: string; }
interface Department { id: string; name: string; sector: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  allProfiles: Profile[];
  departments: Department[];
}

const ROLE_LABELS = {
  ceo:      "CEO",
  director: "Diretor(a)",
  manager:  "Gestor(a)",
  admin:    "Administrador",
} as const;

export default function UserCreateDialog({ open, onClose, allProfiles, departments }: Props) {
  const [pending, setPending] = useState(false);

  const form = useForm<UserCreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      name:          "",
      email:         "",
      role:          "manager",
      department_id: null,
      superior_id:   null,
    },
  });

  async function onSubmit(values: UserCreateValues) {
    setPending(true);
    const result = await createUserProfile(values);
    setPending(false);

    if (result?.error) {
      toast.error("Erro ao criar usuário. Verifique os campos.");
      return;
    }
    toast.success("Usuário criado! Ele aparecerá com o perfil completo após o primeiro login.");
    form.reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { form.reset(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#364B59]">Novo Usuário</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Cria um perfil reservado. Quando o colaborador fizer o primeiro login via Google,
            o perfil será vinculado automaticamente com as permissões já configuradas.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl><Input placeholder="Ex: João Silva" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail corporativo</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="colaborador@estaleiromaua.ind.br"
                    {...field}
                  />
                </FormControl>
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
                <Select
                  onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                  value={field.value ?? "none"}
                >
                  <FormControl><SelectTrigger><SelectValue placeholder="Sem departamento" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sem departamento</SelectItem>
                    {departments.map((d) => (
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
                <Select
                  onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                  value={field.value ?? "none"}
                >
                  <FormControl><SelectTrigger><SelectValue placeholder="Sem superior" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sem superior</SelectItem>
                    {allProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { form.reset(); onClose(); }}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="bg-[#364B59] hover:bg-[#2D3F4A] text-white"
              >
                {pending ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
