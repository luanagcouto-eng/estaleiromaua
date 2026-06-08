-- Migration: org_chart_progress
-- Aplicada em: 2026-06-08
-- Objetivo: fornecer o consolidado de progresso por SUBÁRVORE de departamento
-- (departamento + todos os seus descendentes) e o consolidado da empresa,
-- para alimentar o organograma gamificado do CEO sem cálculo no front-end.

CREATE OR REPLACE VIEW public.org_chart_progress AS
WITH RECURSIVE dept_tree AS (
  SELECT id AS root_id, id AS dept_id FROM public.departments
  UNION ALL
  SELECT dt.root_id, d.id
  FROM public.departments d
  JOIN dept_tree dt ON d.parent_id = dt.dept_id
)
SELECT
  d.id   AS department_id,
  d.name AS department_name,
  d.sector,
  d.parent_id,
  COALESCE(
    SUM(CASE WHEN g.target_value > 0 THEN (g.current_value / g.target_value) * g.weight ELSE 0 END)
    / NULLIF(SUM(g.weight), 0) * 100, 0
  )::numeric(5,1) AS progress_pct,
  COUNT(g.id) AS goals_count,
  COUNT(CASE WHEN g.current_value >= g.target_value THEN 1 END) AS goals_completed
FROM public.departments d
JOIN dept_tree dt ON dt.root_id = d.id
LEFT JOIN public.goals g ON g.department_id = dt.dept_id AND g.period LIKE '2026%'
GROUP BY d.id, d.name, d.sector, d.parent_id;

-- Consolidado geral da empresa (nó CEO do organograma)
CREATE OR REPLACE VIEW public.company_progress AS
SELECT
  COALESCE(
    SUM(CASE WHEN g.target_value > 0 THEN (g.current_value / g.target_value) * g.weight ELSE 0 END)
    / NULLIF(SUM(g.weight), 0) * 100, 0
  )::numeric(5,1) AS progress_pct,
  COUNT(g.id) AS goals_count,
  COUNT(CASE WHEN g.current_value >= g.target_value THEN 1 END) AS goals_completed
FROM public.goals g
WHERE g.period LIKE '2026%';

GRANT SELECT ON public.org_chart_progress TO authenticated;
GRANT SELECT ON public.company_progress   TO authenticated;
