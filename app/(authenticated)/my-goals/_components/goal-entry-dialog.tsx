"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { goalEntrySchema, GOAL_PERIODS, type GoalEntryFormValues } from "@/lib/schemas/goal-entry";
import { createGoalEntry } from "@/lib/actions/goal-history";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatGoalValue } from "@/lib/utils";

const PERIOD_LABELS: Record<string, string> = {
  "2026-ANUAL": "Anual (2026)",
  "2026-Q1": "1º Trimestre (T1)",
  "2026-Q2": "2º Trimestre (T2)",
  "2026-Q3": "3º Trimestre (T3)",
  "2026-Q4": "4º Trimestre (T4)",
};

interface Props {
  open: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle: string;
  unit: string;
  targetValue: number;
  goalPeriod: string;
}

const DEFAULTS: GoalEntryFormValues = { period: "2026-Q2", value: 0, notes: "", evidence_url: "" };
const MAX_FILE_MB = 10;

export default function GoalEntryDialog({ open, onClose, goalId, goalTitle, unit, targetValue, goalPeriod }: Props) {
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<GoalEntryFormValues>({
    resolver: zodResolver(goalEntrySchema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      form.reset({ ...DEFAULTS, period: (GOAL_PERIODS as readonly string[]).includes(goalPeriod) ? goalPeriod as typeof GOAL_PERIODS[number] : "2026-Q2" });
      setFileName(null);
    }
  }, [open, form, goalPeriod]);

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

        <p className="text-sm text-muted-foreground -mt-2">
          {goalTitle} · meta: <span className="font-medium text-text">{formatGoalValue(targetValue, unit)}</span>
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

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
                      PNG, JPG, PDF · máx. {MAX_FILE_MB} MB
                    </span>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
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
                {pending ? "Enviando..." : "Lançar resultado"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
