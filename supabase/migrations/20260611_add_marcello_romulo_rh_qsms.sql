-- Migration: add_marcello_romulo_rh_qsms
-- Aplicada em: 2026-06-11
-- Marcello Rômulo passa a ser o responsável pela Gerência RH e pela
-- Gerência de QSMS (ambas sob a Diretoria Comercial /Administrativa).

-- 1. Cria o perfil placeholder de Marcello Rômulo, com a Gerência RH como
--    departamento principal e Hensel (Diretor Comercial/Administrativo)
--    como superior.
WITH new_profile AS (
  INSERT INTO public.profiles (id, name, email, role, department_id, superior_id, is_placeholder)
  VALUES (
    gen_random_uuid(),
    'Marcello Rômulo',
    'marcello.romulo@estaleiromaua.ind.br',
    'manager',
    '00000002-0000-0000-0000-000000000006', -- Gerência RH
    '6b4c03d6-2626-48c1-ab86-e9504a58b15f', -- Hensel da Silva Gonçalves
    true
  )
  RETURNING id
)
-- 2. Vincula o novo perfil às duas gerências via profile_departments,
--    permitindo que ele apareça como responsável em ambas no organograma.
INSERT INTO public.profile_departments (profile_id, department_id)
SELECT new_profile.id, dept_id
FROM new_profile
CROSS JOIN (VALUES
  ('00000002-0000-0000-0000-000000000006'::uuid), -- Gerência RH
  ('00000002-0000-0000-0000-000000000007'::uuid)  -- Gerência de QSMS
) AS depts(dept_id);

-- 3. Restaura o role_config para provisionar Marcello como Gerente RH
--    automaticamente caso ele faça login.
INSERT INTO public.role_config (email_pattern, default_role, department_id, display_name)
VALUES ('marcello.r%', 'manager', '00000002-0000-0000-0000-000000000006', 'Gerente RH')
ON CONFLICT (email_pattern) DO UPDATE
SET default_role = EXCLUDED.default_role,
    department_id = EXCLUDED.department_id,
    display_name = EXCLUDED.display_name;
