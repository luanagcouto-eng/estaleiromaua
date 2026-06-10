"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { buildGoalEntrySchema, GOAL_PERIODS, type GoalEntryFormValues } from "@/lib/schemas/goal-entry";
import { createGoalEntry, updateGoalEntry } from "@/lib/actions/goal-history";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { formatGoalValue, OP_SYMBOL } from "@/lib/utils";

const PERIOD_LABELS: Record<string, string> = {
  "2026-ANUAL": "Anual (2026)",
  "2026-Q1": "1º Trimestre (T1)",
  "2026-Q2": "2º Trimestre (T2)",
  "2026-Q3": "3º Trimestre (T3)",
  "2026-Q4": "4º Trimestre (T4)",
};

const FIVE_WHYS_INDEXES = [0, 1, 2, 3, 4] as const;

export interface EditableGoalEntry {
  id: string;
  value: number;
  period: string | null;
  data_source: string | null;
  criteria: string | null;
  formula_used: string | null;
  evidence_url: string[] | null;
  justification: string | null;
  five_whys: string[] | null;
  action_plan: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle: string;
  unit: string;
  targetValue: number;
  operator: string;
  goalPeriod: string;
  entry?: EditableGoalEntry | null;
}

const DEFAULTS: GoalEntryFormValues = {
  period: "2026-Q2",
  value: 0,
  data_source: "",
  criteria: "",
  formula_used: "",
  evidence_url: "",
  justification: "",
  five_whys: ["", "", "", "", ""],
  action_plan: "",
};
const MAX_FILE_MB = 10;
const FILE_ACCEPT = "image/*,application/pdf,.csv,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function entryToFormValues(entry: EditableGoalEntry, goalPeriod: string): GoalEntryFormValues {
  const period = (GOAL_PERIODS as readonly string[]).includes(entry.period ?? "")
    ? (entry.period as typeof GOAL_PERIODS[number])
    : (GOAL_PERIODS as readonly string[]).includes(goalPeriod)
      ? (goalPeriod as typeof GOAL_PERIODS[number])
      : "2026-Q2";

  return {
    period,
    value: entry.value,
    data_source: entry.data_source ?? "",
    criteria: entry.criteria ?? "",
    formula_used: entry.formula_used ?? "",
    evidence_url: entry.evidence_url?.[0] ?? "",
    justification: entry.justification ?? "",
    five_whys: entry.five_whys && entry.five_whys.length === 5 ? entry.five_whys : ["", "", "", "", ""],
    action_plan: entry.action_plan ?? "",
  };
}

export default function GoalEntryDialog({ open, onClose, goalId, goalTitle, unit, targetValue, operator, goalPeriod, entry }: Props) {
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const schema = useMemo(() => buildGoalEntrySchema(targetValue), [targetValue]);

  const form = useForm<GoalEntryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        entry
          ? entryToFormValues(entry, goalPeriod)
          : { ...DEFAULTS, period: (GOAL_PERIODS as readonly string[]).includes(goalPeriod) ? goalPeriod as typeof GOAL_PERIODS[number] : "2026-Q2" }
      );
      setFileName(null);
    }
  }, [open, form, goalPeriod, entry]);

  const enteredValue = form.watch("value");
  const exceedsTarget = Number.isFinite(enteredValue) && Number(enteredValue) > targetValue;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Limite: ${MAX_FILE_MB} MB`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${goalId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: signedData } = await supabase.storage
        .from("evidence")
        .createSignedUrl(path, 315360000); // ~10 anos

      if (!signedData?.signedUrl) throw new Error("Erro ao gerar URL");

      form.setValue("evidence_url", signedData.signedUrl, { shouldValidate: true });
      setFileName(file.name);
      toast.success("Arquivo enviado com sucesso!");
    } catch (err) {
      toast.error("Erro ao enviar arquivo. Tente novamente.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: GoalEntryFormValues) {
    setPending(true);
    const result = entry
      ? await updateGoalEntry(entry.id, values)
      : await createGoalEntry(goalId, values);
    setPending(false);

    if (result?.error) {
      toast.error("Erro ao registrar lançamento. Verifique os campos.");
      return;
    }
    toast.success(entry ? "Lançamento atualizado com sucesso!" : "Resultado lançado com sucesso!");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#364B59]">{entry ? "Editar lançamento" : "Lançar resultado"}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-2">
          {goalTitle} · meta:{" "}
          <span className="font-mono font-bold">{OP_SYMBOL[operator] ?? operator}</span>{" "}
          <span className="font-medium text-text">{formatGoalValue(targetValue, unit)}</span>
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <FormField control={form.control} name="period" render={({ field }) => (
                <FormItem>
                  <FormLabel>Período de referência</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <span className={!field.value ? "text-muted-foreground text-sm" : "text-sm"}>
                          {field.value ? (PERIOD_LABELS[field.value] ?? field.value) : "Selecione o período"}
                        </span>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GOAL_PERIODS.map((p) => (
                        <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <FormField control={form.control} name="data_source" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonte de dados</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Ex: sistema XPTO, planilha de controle, relatório financeiro..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="criteria" render={({ field }) => (
                <FormItem>
                  <FormLabel>Critério</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Ex: considerar apenas dias úteis, valores líquidos de impostos..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="formula_used" render={({ field }) => (
              <FormItem>
                <FormLabel>Fórmula utilizada</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="Ex: (data de entrega − data do pedido) / total de pedidos" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {exceedsTarget && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  ⚠️ O valor atingido ultrapassou a meta — justifique e proponha um plano de ação
                </p>

                <FormField control={form.control} name="justification" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justificativa</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Explique os fatores que levaram o valor a ultrapassar a meta..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="space-y-2">
                  <FormLabel>Análise de causa raiz — Método dos 5 Porquês</FormLabel>
                  {FIVE_WHYS_INDEXES.map((i) => (
                    <FormField key={i} control={form.control} name={`five_whys.${i}`} render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder={`${i + 1}º Porquê`} {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}
                </div>

                <FormField control={form.control} name="action_plan" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano de ação</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Descreva as ações, responsáveis e prazos para corrigir a causa raiz identificada..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            <FormField control={form.control} name="evidence_url" render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Evidência{" "}
                  <span className="text-red-500 font-medium">(obrigatória)</span>
                </FormLabel>

                {/* Upload de arquivo — ação principal */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="shrink-0 text-[#364B59] border-[#364B59] hover:bg-[#364B59] hover:text-white"
                  >
                    {uploading ? "Enviando..." : "📎 Anexar arquivo"}
                  </Button>
                  {fileName ? (
                    <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 truncate max-w-[180px]">
                      ✓ {fileName}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG, PDF, CSV, XLSX · máx. {MAX_FILE_MB} MB
                    </span>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept={FILE_ACCEPT}
                    onChange={handleFileChange}
                  />
                </div>

                {/* URL alternativa */}
                <FormDescription className="text-xs text-muted-foreground">
                  Ou cole o link direto (Drive, SharePoint, etc.):
                </FormDescription>
                <FormControl>
                  <Input placeholder="https://drive.google.com/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={pending || uploading}
                className="bg-[#364B59] hover:bg-[#2D3F4A] text-white">
                {pending ? "Enviando..." : entry ? "Salvar alterações" : "Lançar resultado"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
