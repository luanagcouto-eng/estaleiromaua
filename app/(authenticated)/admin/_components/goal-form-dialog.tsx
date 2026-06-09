"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { goalSchema, type GoalFormValues } from "@/lib/schemas/goal";
import { createGoal, updateGoal } from "@/lib/actions/goals";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WeightIndicator from "./weight-indicator";

interface Profile { id: string; name: string; email: string; }
interface Department { id: string; name: string; sector: string; }
interface Goal extends GoalFormValues { id: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  goal?: Goal | null;
  profiles: Profile[];
  departments: Department[];
  goalsByOwner: Record<string, number>; // owner_id → total weight
}

const PERIODS = ["2026-ANUAL", "2026-Q1", "2026-Q2", "2026-Q3", "2026-Q4"] as const;
const UNITS   = ["%", "R$", "dias", "unidades", "pontos", "horas"] as const;

export default function GoalFormDialog({ open, onClose, goal, profiles, departments, goalsByOwner }: Props) {
  const isEdit = !!goal;
  const [pending, setPending] = useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal ?? {
      title: "", description: "", period: "2026-ANUAL",
      weight: 0, target_value: 0, unit: "%",
      owner_id: "", department_id: "",
    },
  });

  useEffect(() => {
    if (open) form.reset(goal ?? {
      title: "", description: "", period: "2026-ANUAL",
      weight: 0, target_value: 0, unit: "%",
      owner_id: "", department_id: "",
    });
  }, [open, goal, form]);

  const selectedOwner = form.watch("owner_id");
  const currentWeight = form.watch("weight") || 0;
  const usedWeight = selectedOwner
    ? (goalsByOwner[selectedOwner] ?? 0) - (isEdit ? (goal?.weight ?? 0) : 0)
    : 0;

  async function onSubmit(values: GoalFormValues) {
    setPending(true);
    const result = isEdit
      ? await updateGoal(goal!.id, values)
      : await createGoal(values);
    setPending(false);

    if (result?.error) {
      toast.error("Erro ao salvar meta. Verifique os campos.");
      return;
    }
    toast.success(isEdit ? "Meta atualizada!" : "Meta criada!");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#364B59]">{isEdit ? "Editar Meta" : "Nova Meta"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl><Input placeholder="Ex: Reduzir índice de retrabalho" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição <span className="text-muted-foreground">(opcional)</span></FormLabel>
                <FormControl><Textarea rows={2} placeholder="Detalhes, contexto ou critério de aceitação..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="owner_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um responsável">
                        {field.value
                          ? profiles.find(p => p.id === field.value)?.name ?? "Selecione um responsável"
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-medium">{p.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{p.email}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="department_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um departamento">
                        {field.value
                          ? departments.find(d => d.id === field.value)?.name ?? "Selecione um departamento"
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-3">
              <FormField control={form.control} name="period" render={({ field }) => (
                <FormItem>
                  <FormLabel>Período</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PERIODS.map(p => <SelectItem key={p} value={p}>{p.replace("2026-", "")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="target_value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="weight" render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" min="0.1" max="100" {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {selectedOwner && (
              <WeightIndicator used={usedWeight} adding={currentWeight} />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={pending}
                className="bg-[#364B59] hover:bg-[#2D3F4A] text-white">
                {pending ? "Salvando..." : isEdit ? "Salvar" : "Criar Meta"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
