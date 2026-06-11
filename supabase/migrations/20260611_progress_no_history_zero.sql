-- Migration: progress_no_history_zero
-- Aplicada em: 2026-06-11
-- Objetivo: metas sem nenhum lançamento em goal_history (current_value ainda no
-- valor padrão 0) não devem contribuir com 200% (operadores <=/<) nem ser
-- contadas como "concluídas" em org_chart_progress/company_progress. Isso
-- espelha o calcProgress(..., hasHistory) do front-end: sem lançamento, a
-- contribuição da meta para o progresso é 0 e ela não conta em goals_completed.

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
    SUM(
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM public.goal_history gh WHERE gh.goal_id = g.id) THEN 0
        WHEN g.target_value > 0 AND g.operator IN ('<=', '<') THEN
          (1 + (g.target_value - g.current_value) / g.target_value) * g.weight
        WHEN g.target_value > 0 THEN
          (g.current_value / g.target_value) * g.weight
        ELSE 0
      END
    ) / NULLIF(SUM(g.weight), 0) * 100, 0
  )::numeric(5,1) AS progress_pct,
  COUNT(g.id) AS goals_count,
  COUNT(
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.goal_history gh WHERE gh.goal_id = g.id) THEN NULL
      WHEN g.operator IN ('<=', '<') AND g.current_value <= g.target_value THEN 1
      WHEN g.operator NOT IN ('<=', '<') AND g.current_value >= g.target_value THEN 1
    END
  ) AS goals_completed
FROM public.departments d
JOIN dept_tree dt ON dt.root_id = d.id
LEFT JOIN public.goals g ON g.department_id = dt.dept_id AND g.period LIKE '2026%'
GROUP BY d.id, d.name, d.sector, d.parent_id;

-- Consolidado geral da empresa (nó CEO do organograma)
CREATE OR REPLACE VIEW public.company_progress AS
SELECT
  COALESCE(
    SUM(
      CASE
        WHEN NOT EXISTS (SELECT 1 FROM public.goal_history gh WHERE gh.goal_id = g.id) THEN 0
        WHEN g.target_value > 0 AND g.operator IN ('<=', '<') THEN
          (1 + (g.target_value - g.current_value) / g.target_value) * g.weight
        WHEN g.target_value > 0 THEN
          (g.current_value / g.target_value) * g.weight
        ELSE 0
      END
    ) / NULLIF(SUM(g.weight), 0) * 100, 0
  )::numeric(5,1) AS progress_pct,
  COUNT(g.id) AS goals_count,
  COUNT(
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.goal_history gh WHERE gh.goal_id = g.id) THEN NULL
      WHEN g.operator IN ('<=', '<') AND g.current_value <= g.target_value THEN 1
      WHEN g.operator NOT IN ('<=', '<') AND g.current_value >= g.target_value THEN 1
    END
  ) AS goals_completed
FROM public.goals g
WHERE g.period LIKE '2026%';

GRANT SELECT ON public.org_chart_progress TO authenticated;
GRANT SELECT ON public.company_progress   TO authenticated;
