/* ─── Enums ─────────────────────────────────────────────────────── */

export type UserRole = "ceo" | "director" | "manager" | "admin";

export type Sector =
  | "Financeiro"
  | "Produção"
  | "Planejamento"
  | "Qualidade"
  | "Manutenção"
  | "Compliance"
  | "Comercial"
  | "EHS"
  | "RH"
  | "TI"
  | "Suprimentos"
  | "Contratos"
  | "Operações";

export type Period = "2026-ANUAL" | "2026-Q1" | "2026-Q2" | "2026-Q3" | "2026-Q4";

export type GoalUnit = "%" | "R$" | "dias" | "unidades" | "pontos" | "horas";

/* ─── Entidades do banco ─────────────────────────────────────────── */

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department_id: string | null;
  superior_id: string | null;
  avatar_url: string | null;
  is_placeholder: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  sector: Sector;
  director_id: string | null;
  parent_id: string | null;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  period: Period;
  weight: number;
  target_value: number;
  current_value: number;
  unit: GoalUnit;
  owner_id: string;
  department_id: string;
  created_at: string;
  updated_at: string;
}

export interface GoalHistory {
  id: string;
  goal_id: string;
  value: number;
  notes: string | null;
  evidence_url: string[] | null;
  recorded_at: string;
  recorded_by: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip: string | null;
  timestamp: string;
}

/* ─── Views / Agregados ──────────────────────────────────────────── */

export interface DepartmentProgress {
  department_id: string;
  department_name: string;
  sector: Sector;
  progress_pct: number;   // 0–100, calculado pela view materializada
  goals_count: number;
  goals_completed: number;
}

export interface OrgNode {
  id: string;
  name: string;
  title: string;
  department: string;
  progress_pct: number;
  is_placeholder: boolean;
  children?: OrgNode[];
}
