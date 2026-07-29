BEGIN;

CREATE TABLE IF NOT EXISTS public.demo_bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_key text NOT NULL CHECK (profile_key IN ('aisha','tunde','musa','zainab','chinedu','fatima','emeka','kemi')),
  connected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.circle_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  cycle_number integer NOT NULL CHECK (cycle_number > 0),
  due_date date NOT NULL,
  simulated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  UNIQUE (circle_id, cycle_number)
);

CREATE TABLE IF NOT EXISTS public.demo_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.circle_cycles(id) ON DELETE CASCADE,
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  outcome text NOT NULL CHECK (outcome IN ('early','on_time','late','failed')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.readiness_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.circle_cycles(id) ON DELETE CASCADE,
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  readiness text NOT NULL CHECK (readiness IN ('ready','protection_recommended','action_required')),
  inflow_trend text NOT NULL,
  on_time_rate integer NOT NULL CHECK (on_time_rate BETWEEN 0 AND 100),
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cycle_id, profile_id)
);

ALTER TABLE public.demo_bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS demo_connections_select ON public.demo_bank_connections;
CREATE POLICY demo_connections_select ON public.demo_bank_connections FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.can_administer_circle(circle_id, auth.uid()));
DROP POLICY IF EXISTS demo_connections_insert_self ON public.demo_bank_connections;
CREATE POLICY demo_connections_insert_self ON public.demo_bank_connections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_active_member(circle_id, auth.uid()));
DROP POLICY IF EXISTS demo_connections_update_self ON public.demo_bank_connections;
CREATE POLICY demo_connections_update_self ON public.demo_bank_connections FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS demo_connections_delete_self ON public.demo_bank_connections;
CREATE POLICY demo_connections_delete_self ON public.demo_bank_connections FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS circle_cycles_select_member ON public.circle_cycles;
CREATE POLICY circle_cycles_select_member ON public.circle_cycles FOR SELECT TO authenticated USING (public.is_active_member(circle_id, auth.uid()));
DROP POLICY IF EXISTS circle_cycles_insert_admin ON public.circle_cycles;
CREATE POLICY circle_cycles_insert_admin ON public.circle_cycles FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.can_administer_circle(circle_id, auth.uid()));

DROP POLICY IF EXISTS demo_contributions_select_member ON public.demo_contributions;
CREATE POLICY demo_contributions_select_member ON public.demo_contributions FOR SELECT TO authenticated USING (public.is_active_member(circle_id, auth.uid()));
DROP POLICY IF EXISTS demo_contributions_insert_admin ON public.demo_contributions;
CREATE POLICY demo_contributions_insert_admin ON public.demo_contributions FOR INSERT TO authenticated WITH CHECK (public.can_administer_circle(circle_id, auth.uid()));

DROP POLICY IF EXISTS readiness_select_member ON public.readiness_assessments;
CREATE POLICY readiness_select_member ON public.readiness_assessments FOR SELECT TO authenticated USING (public.is_active_member(circle_id, auth.uid()));
DROP POLICY IF EXISTS readiness_insert_admin ON public.readiness_assessments;
CREATE POLICY readiness_insert_admin ON public.readiness_assessments FOR INSERT TO authenticated WITH CHECK (public.can_administer_circle(circle_id, auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.demo_bank_connections TO authenticated;
GRANT SELECT, INSERT ON public.circle_cycles TO authenticated;
GRANT SELECT, INSERT ON public.demo_contributions TO authenticated;
GRANT SELECT, INSERT ON public.readiness_assessments TO authenticated;

COMMIT;
