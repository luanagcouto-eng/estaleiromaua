"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { goalEntrySchema, type GoalEntryFormValues } from "@/lib/schemas/goal-entry";
import { createGoalEntry } from "@/lib/actions/goal-history";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatGoalValue } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle: string;
  unit: string;
  targetValue: number;
}

const DEFAULTS: GoalEntryFormValues = { value: 0, notes: "", evidence_url: "" };

export default function GoalEntryDialog({ open, onClose, goalId, goalTitle, unit, targetValue }: Props) {
  const [pending, setPending] = useState(false);

  const form = useForm<GoalEntryFormValues>({
    resolver: zodResolver(goalEntrySchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) form.reset(DEFAULTS);
  }, [open, form]);

  async function onSubmit(values: GoalEntryFormValues) {
    setPending(true);
    const result = await createGoalEntry(goalId, values);
    setPending(false);

    if (result?.error) {
      toast.error("Erro ao registrar lançamento. Verifique os campos.");
      return;
    }
    toast.success("Resultado lançado com sucesso!");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#364B59]">Lançar resultado</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted -mt-2">
          {goalTitle} · meta: <span className="font-medium text-text">{formatGoalValue(targetValue, unit)}</span>
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField control={form.control} name="value" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor atingido ({unit})</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Memória de cálculo</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="Explique como o valor foi apurado: fonte dos dados, período de referência, fórmula utilizada..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="evidence_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Evidência <span className="text-muted">(opcional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="Link para planilha, relatório, print ou documento..." {...field} />
                </FormControl>
                <FormDescription>Cole a URL de um arquivo já compartilhado (Drive, SharePoint, etc.)</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={pending}
                className="bg-[#364B59] hover:bg-[#2D3F4A] text-white">
                {pending ? "Enviando..." : "Lançar resultado"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
