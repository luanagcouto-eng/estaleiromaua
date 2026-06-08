"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { goalTextClass } from "@/lib/utils";

export interface NodeDetail {
  id: string;
  name: string;
  director: string | null;
  isPlaceholder: boolean;
  progress: number;
  goalsCount: number;
  goalsCompleted: number;
  subDepartments: { id: string; name: string; progress: number }[];
}

interface Props {
  node: NodeDetail | null;
  onClose: () => void;
}

export default function NodeDetailSheet({ node, onClose }: Props) {
  return (
    <Sheet open={!!node} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {node && (
          <>
            <SheetHeader>
              <SheetTitle className="text-[#364B59]">{node.name}</SheetTitle>
              <SheetDescription>
                {node.isPlaceholder ? (
                  <span className="italic">Cargo em aberto</span>
                ) : (
                  <>Responsável: <span className="font-medium text-text">{node.director}</span></>
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-6 space-y-6">
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Progresso consolidado 2026</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${goalTextClass(node.progress)}`}>
                    {node.progress.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-white overflow-hidden border border-border">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(0, Math.min(100, node.progress))}%`, backgroundColor: "#F18213" }}
                  />
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted">
                  <span>{node.goalsCount} meta{node.goalsCount !== 1 ? "s" : ""}</span>
                  <span>{node.goalsCompleted} concluída{node.goalsCompleted !== 1 ? "s" : ""}</span>
                </div>
              </div>

              {node.subDepartments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#364B59] mb-2">Áreas subordinadas</h3>
                  <ul className="space-y-2">
                    {node.subDepartments.map((sub) => (
                      <li key={sub.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                        <span className="text-text">{sub.name}</span>
                        <Badge variant="secondary" className={goalTextClass(sub.progress)}>
                          {sub.progress.toFixed(0)}%
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {node.isPlaceholder && (
                <p className="text-xs text-muted italic">
                  Este cargo ainda não possui um responsável atribuído. Acesse Admin → Usuários para vincular um colaborador.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
