-- Migration: rls_policies_and_views
-- Aplicada em: 2026-06-08

-- Helpers de role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_subordinate_ids(manager_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.profiles WHERE superior_id = manager_id;
$$;

-- RLS: profiles, departments, goals, goal_history, audit_log
-- (ver conteúdo completo no historico_brainstorm.md)

-- Materialized view para painel CEO
CREATE MATERIALIZED VIEW public.department_progress AS
SELECT
  d.id AS department_id, d.name AS department_name, d.sector,
  COALESCE(
    SUM(CASE WHEN g.target_value > 0 THEN (g.current_value / g.target_value) * g.weight ELSE 0 END)
    / NULLIF(SUM(g.weight), 0) * 100, 0
  )::numeric(5,1) AS progress_pct,
  COUNT(g.id) AS goals_count,
  COUNT(CASE WHEN g.current_value >= g.target_value THEN 1 END) AS goals_completed
FROM public.departments d
LEFT JOIN public.goals g ON g.department_id = d.id AND g.period LIKE '2026%'
GROUP BY d.id, d.name, d.sector;

CREATE UNIQUE INDEX idx_dept_progress_id ON public.department_progress(department_id);
