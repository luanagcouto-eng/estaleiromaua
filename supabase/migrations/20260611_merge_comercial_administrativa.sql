-- Migration: merge_comercial_administrativa
-- Aplicada em: 2026-06-11
-- Objetivo: renomear "Diretoria Comercial" para "Diretoria Comercial /Administrativa"
-- e mover Gerência RH e Gerência de QSMS (e seus departamentos filhos) para dentro
-- dela, removendo a antiga "Diretoria RH / QSMS" (sem diretor real, apenas um
-- placeholder) do organograma.

-- 1. Move Gerência RH e Gerência de QSMS para sob a Diretoria Comercial
UPDATE public.departments
SET parent_id = '00000001-0000-0000-0000-000000000003'
WHERE id IN (
  '00000002-0000-0000-0000-000000000006', -- Gerência RH
  '00000002-0000-0000-0000-000000000007'  -- Gerência de QSMS
);

-- 2. Renomeia a Diretoria Comercial
UPDATE public.departments
SET name = 'Diretoria Comercial /Administrativa'
WHERE id = '00000001-0000-0000-0000-000000000003';

-- 3. Remove o placeholder de diretor da antiga Diretoria RH / QSMS
DELETE FROM public.profile_departments
WHERE profile_id = '41373331-0f6f-4647-831c-488520644c1a';

DELETE FROM public.profiles
WHERE id = '41373331-0f6f-4647-831c-488520644c1a';

-- 3b. Remove o role_config que provisionava o cargo de Diretor RH/EHS
DELETE FROM public.role_config
WHERE department_id = '00000001-0000-0000-0000-000000000002';

-- 4. Remove a antiga Diretoria RH / QSMS (sem mais filhos nem responsável)
DELETE FROM public.departments
WHERE id = '00000001-0000-0000-0000-000000000002';
