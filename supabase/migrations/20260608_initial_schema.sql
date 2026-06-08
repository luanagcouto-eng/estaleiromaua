-- Migration: initial_schema
-- Aplicada em: 2026-06-08
-- Projeto: MetasMaua2026 (hkguphmtiwwjjnadnbdq)

-- ─── Enums ───────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('ceo', 'director', 'manager', 'admin');
CREATE TYPE goal_unit AS ENUM ('%', 'R$', 'dias', 'unidades', 'pontos', 'horas');

-- ─── Profiles ────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id             uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          text        UNIQUE NOT NULL,
  name           text        NOT NULL,
  role           user_role   NOT NULL DEFAULT 'manager',
  department_id  uuid,
  superior_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  avatar_url     text,
  is_placeholder boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── Departments ─────────────────────────────────────────────────
CREATE TABLE public.departments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  sector      text        NOT NULL,
  director_id uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_id   uuid        REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;

-- ─── Goals ───────────────────────────────────────────────────────
CREATE TABLE public.goals (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  description   text,
  period        text        NOT NULL DEFAULT '2026-ANUAL',
  weight        numeric(5,2) NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 100),
  target_value  numeric     NOT NULL,
  current_value numeric     NOT NULL DEFAULT 0,
  unit          goal_unit   NOT NULL DEFAULT '%',
  owner_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id uuid        NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── Goal History ─────────────────────────────────────────────────
CREATE TABLE public.goal_history (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id      uuid        NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  value        numeric     NOT NULL,
  notes        text,
  evidence_url text[],
  recorded_at  timestamptz NOT NULL DEFAULT now(),
  recorded_by  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ─── Audit Log ───────────────────────────────────────────────────
CREATE TABLE public.audit_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action     text        NOT NULL,
  entity_id  uuid,
  old_value  jsonb,
  new_value  jsonb,
  ip         text,
  timestamp  timestamptz NOT NULL DEFAULT now()
);

-- ─── Índices ─────────────────────────────────────────────────────
CREATE INDEX idx_goals_owner_period ON public.goals(owner_id, period);
CREATE INDEX idx_goals_department   ON public.goals(department_id);
CREATE INDEX idx_goal_history_goal  ON public.goal_history(goal_id, recorded_at DESC);
CREATE INDEX idx_profiles_superior  ON public.profiles(superior_id);
CREATE INDEX idx_audit_log_user     ON public.audit_log(user_id, timestamp DESC);

-- ─── Triggers ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION audit_goals_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, entity_id, old_value, new_value)
  VALUES (
    auth.uid(), TG_OP || '_GOAL', COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD)::jsonb END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER goals_audit AFTER INSERT OR UPDATE OR DELETE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION audit_goals_change();
