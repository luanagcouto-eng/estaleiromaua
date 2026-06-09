"use client";

import { useEffect, useMemo, useState } from "react";
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
interface Department { id: string; name: string; sector: string; parent_id: string | null; }
interface Goal extends GoalFormValues { id: string; }

const DEPTH_PREFIX: Record<number, string> = { 0: "", 1: "↳ ", 2: "  ↳ " };
const OP_SYMBOL: Record<string, string> = { ">=": "≥", ">": ">", "<=": "≤", "<": "<", "=": "=" };

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

  const hierarchicalDepts = useMemo(() => {
    const result: Array<{ dept: Department; depth: number }> = [];
    function addChildren(parentId: string | null, depth: number) {
      const children = departments
        .filter(d => d.parent_id === parentId)
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      for (const child of children) {
        result.push({ dept: child, depth });
        addChildren(child.id, depth + 1);
      }
    }
    addChildren(null, 0);
    return result;
  }, [departments]);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal ?? {
      title: "", description: "", period: "2026-ANUAL",
      weight: 0, target_value: 0, unit: "%", operator: ">=",
      sub_weight: null,
      owner_id: "", department_id: "",
    },
  });

  useEffect(() => {
    if (open) form.reset(goal ?? {
      title: "", description: "", period: "2026-ANUAL",
      weight: 0, target_value: 0, unit: "%", operator: ">=",
      sub_weight: null,
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
                      <SelectValue placeholder="Selecione um responsável" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="department_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento / Setor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione departamento ou setor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {hierarchicalDepts.map(({ dept, depth }) => (
                      <SelectItem
                        key={dept.id}
                        value={dept.id}
                        className={depth === 1 ? "pl-7" : depth === 2 ? "pl-11" : "font-semibold"}
                      >
                        {DEPTH_PREFIX[depth] ?? "  ↳ "}{dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-[1fr_0.65fr_1.3fr_1fr] gap-3">
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

              <FormField control={form.control} name="operator" render={({ field }) => (
                <FormItem>
                  <FormLabel title="Operador: realização deve ser ≥ / > / ≤ / < ao valor alvo">
                    Operador
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-mono font-bold text-base justify-center gap-0">
                        <span>{OP_SYMBOL[field.value] ?? field.value}</span>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value=">=" className="font-mono">≥ &nbsp;maior ou igual</SelectItem>
                      <SelectItem value=">"  className="font-mono">&gt; &nbsp;maior que</SelectItem>
                      <SelectItem value="<=" className="font-mono">≤ &nbsp;menor ou igual</SelectItem>
                      <SelectItem value="<"  className="font-mono">&lt; &nbsp;menor que</SelectItem>
                      <SelectItem value="="  className="font-mono">= &nbsp;igual a</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="target_value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
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

            <div className="grid grid-cols-2 gap-3">
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

              <FormField control={form.control} name="sub_weight" render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Subpeso (%)
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number" step="0.1" min="0" max="100"
                      placeholder="—"
                      value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

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
