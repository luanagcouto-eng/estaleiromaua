import { formatGoalValue } from "@/lib/utils";

export interface GoalHistoryEntry {
  id: string;
  value: number;
  notes: string | null;
  evidence_url: string[] | null;
  recorded_at: string;
}

interface Props {
  entries: GoalHistoryEntry[];
  unit: string;
}

export default function GoalHistoryList({ entries, unit }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-xs text-muted italic px-1">
        Nenhum lançamento registrado ainda.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-text">{formatGoalValue(entry.value, unit)}</span>
            <span className="text-xs text-muted">
              {new Date(entry.recorded_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
          {entry.notes && <p className="mt-1 text-xs text-muted whitespace-pre-wrap">{entry.notes}</p>}
          {entry.evidence_url && entry.evidence_url.length > 0 && (
            <a
              href={entry.evidence_url[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-[#F18213] hover:underline"
            >
              Ver evidência ↗
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
