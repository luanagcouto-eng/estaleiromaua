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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile    { id: string; name: string; email: string; }
interface Department { id: string; name: string; sector: string; }

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

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

function DeptMultiSelect({
  departments,
  selected,
  onChange,
}: {
  departments: Department[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedNames = departments.filter((d) => selected.includes(d.id)).map((d) => d.name);

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={selectedNames.length === 0 ? "text-muted-foreground" : ""}>
          {selectedNames.length === 0 ? "Sem departamento" : selectedNames.join(", ")}
        </span>
        <svg className="h-4 w-4 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-border bg-white shadow-md">
          {departments.map((d) => (
            <label
              key={d.id}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface text-sm"
            >
              <input
                type="checkbox"
                checked={selected.includes(d.id)}
                onChange={() => toggle(d.id)}
                className="h-3.5 w-3.5 rounded accent-[#364B59]"
              />
              {d.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserCreateDialog({ open, onClose, allProfiles, departments }: Props) {
  const [pending, setPending] = useState(false);

  const form = useForm<UserCreateValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      name:           "",
      email:          "",
      role:           "manager",
      department_ids: [],
      superior_id:    null,
      avatar_url:     "",
    },
  });

  const watchedName = form.watch("name");
  const watchedAvatar = form.watch("avatar_url");

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

            <FormField control={form.control} name="department_ids" render={({ field }) => (
              <FormItem>
                <FormLabel>Departamentos</FormLabel>
                <FormControl>
                  <DeptMultiSelect
                    departments={departments}
                    selected={field.value ?? []}
                    onChange={field.onChange}
                  />
                </FormControl>
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
                  <FormControl>
                    <SelectTrigger>
                      <span className={!field.value ? "text-muted-foreground text-sm" : "text-sm"}>
                        {field.value
                          ? allProfiles.find((p) => p.id === field.value)?.name ?? "Superior"
                          : "Sem superior"}
                      </span>
                    </SelectTrigger>
                  </FormControl>
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

            <FormField control={form.control} name="avatar_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Foto de perfil (URL do Google ou outra fonte)</FormLabel>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={watchedAvatar || undefined} alt={watchedName} />
                    <AvatarFallback className="bg-[#364B59] text-white">
                      {initials(watchedName || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <FormControl>
                    <Input placeholder="https://..." {...field} value={field.value ?? ""} />
                  </FormControl>
                </div>
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
