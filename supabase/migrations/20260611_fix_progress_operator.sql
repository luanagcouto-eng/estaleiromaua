-- Migration: fix_progress_operator
-- Aplicada em: 2026-06-11
-- Objetivo: corrigir org_chart_progress/company_progress para metas com
-- operador "menor ou igual" (<=, <), que antes eram tratadas como "maior ou
-- igual" (>=). Para essas metas, Atingimento = 1 + (Meta - Realizado) / Meta,
-- de forma que resultados piores que a meta fiquem abaixo de 100%.

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
        WHEN g.target_value > 0 AND g.operator IN ('<=', '<') THEN
          GREATEST(0, LEAST(1, 1 + (g.target_value - g.current_value) / g.target_value)) * g.weight
        WHEN g.target_value > 0 THEN
          (g.current_value / g.target_value) * g.weight
        ELSE 0
      END
    ) / NULLIF(SUM(g.weight), 0) * 100, 0
  )::numeric(5,1) AS progress_pct,
  COUNT(g.id) AS goals_count,
  COUNT(
    CASE
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
        WHEN g.target_value > 0 AND g.operator IN ('<=', '<') THEN
          GREATEST(0, LEAST(1, 1 + (g.target_value - g.current_value) / g.target_value)) * g.weight
        WHEN g.target_value > 0 THEN
          (g.current_value / g.target_value) * g.weight
        ELSE 0
      END
    ) / NULLIF(SUM(g.weight), 0) * 100, 0
  )::numeric(5,1) AS progress_pct,
  COUNT(g.id) AS goals_count,
  COUNT(
    CASE
      WHEN g.operator IN ('<=', '<') AND g.current_value <= g.target_value THEN 1
      WHEN g.operator NOT IN ('<=', '<') AND g.current_value >= g.target_value THEN 1
    END
  ) AS goals_completed
FROM public.goals g
WHERE g.period LIKE '2026%';

GRANT SELECT ON public.org_chart_progress TO authenticated;
GRANT SELECT ON public.company_progress   TO authenticated;
