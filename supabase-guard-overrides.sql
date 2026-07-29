RESET ROLE;

BEGIN;

CREATE TABLE IF NOT EXISTS public.guard_override_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.circle_cycles(id) ON DELETE CASCADE,
  beneficiary_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 5 AND 200),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE (circle_id, cycle_id)
);

CREATE TABLE IF NOT EXISTS public.guard_override_votes (
  request_id uuid NOT NULL REFERENCES public.guard_override_requests(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('approve', 'reject')),
  voted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, voter_id)
);

ALTER TABLE public.guard_override_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guard_override_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guard_override_requests_select_member ON public.guard_override_requests;
CREATE POLICY guard_override_requests_select_member ON public.guard_override_requests
FOR SELECT TO authenticated
USING (public.is_active_member(circle_id, auth.uid()));

DROP POLICY IF EXISTS guard_override_votes_select_member ON public.guard_override_votes;
CREATE POLICY guard_override_votes_select_member ON public.guard_override_votes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.guard_override_requests request
    WHERE request.id = request_id
      AND public.is_active_member(request.circle_id, auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.request_guard_override(
  p_circle_id uuid,
  p_cycle_number integer,
  p_reason text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_cycle_id uuid;
  v_member_count integer;
  v_position integer;
  v_beneficiary_id uuid;
BEGIN
  IF v_user_id IS NULL OR char_length(trim(p_reason)) NOT BETWEEN 5 AND 200 THEN
    RAISE EXCEPTION 'Invalid full-release request';
  END IF;

  IF NOT public.is_active_member(p_circle_id, v_user_id) THEN
    RAISE EXCEPTION 'Circle access denied';
  END IF;

  SELECT id INTO v_cycle_id
  FROM public.circle_cycles
  WHERE circle_id = p_circle_id AND cycle_number = p_cycle_number;

  SELECT count(*) INTO v_member_count
  FROM public.circle_members
  WHERE circle_id = p_circle_id AND status = 'active';

  v_position := ((p_cycle_number - 1) % v_member_count) + 1;
  SELECT profile_id INTO v_beneficiary_id
  FROM public.circle_members
  WHERE circle_id = p_circle_id AND status = 'active' AND payout_position = v_position
  LIMIT 1;

  IF v_cycle_id IS NULL OR v_beneficiary_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'Only the scheduled recipient can request full release';
  END IF;

  INSERT INTO public.guard_override_requests (circle_id, cycle_id, beneficiary_id, reason)
  VALUES (p_circle_id, v_cycle_id, v_user_id, trim(p_reason))
  ON CONFLICT (circle_id, cycle_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.vote_guard_override(
  p_circle_id uuid,
  p_cycle_number integer,
  p_vote text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_request public.guard_override_requests%ROWTYPE;
  v_member_count integer;
  v_eligible_voters integer;
  v_required integer;
  v_approvals integer;
  v_rejections integer;
BEGIN
  IF v_user_id IS NULL OR p_vote NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid vote';
  END IF;

  IF NOT public.is_active_member(p_circle_id, v_user_id) THEN
    RAISE EXCEPTION 'Circle access denied';
  END IF;

  SELECT request.* INTO v_request
  FROM public.guard_override_requests request
  JOIN public.circle_cycles cycle ON cycle.id = request.cycle_id
  WHERE request.circle_id = p_circle_id AND cycle.cycle_number = p_cycle_number
  FOR UPDATE OF request;

  IF v_request.id IS NULL OR v_request.status <> 'requested' THEN
    RAISE EXCEPTION 'This request is no longer open';
  END IF;
  IF v_request.beneficiary_id = v_user_id THEN
    RAISE EXCEPTION 'The recipient cannot vote on their own request';
  END IF;

  INSERT INTO public.guard_override_votes (request_id, voter_id, vote)
  VALUES (v_request.id, v_user_id, p_vote)
  ON CONFLICT (request_id, voter_id)
  DO UPDATE SET vote = excluded.vote, voted_at = now();

  SELECT count(*) INTO v_member_count
  FROM public.circle_members
  WHERE circle_id = p_circle_id AND status = 'active';
  v_eligible_voters := greatest(v_member_count - 1, 1);
  v_required := floor(v_eligible_voters / 2.0)::integer + 1;

  SELECT
    count(*) FILTER (WHERE vote = 'approve'),
    count(*) FILTER (WHERE vote = 'reject')
  INTO v_approvals, v_rejections
  FROM public.guard_override_votes
  WHERE request_id = v_request.id;

  IF v_approvals >= v_required THEN
    UPDATE public.guard_override_requests SET status = 'approved', resolved_at = now() WHERE id = v_request.id;
  ELSIF v_rejections > v_eligible_voters - v_required THEN
    UPDATE public.guard_override_requests SET status = 'rejected', resolved_at = now() WHERE id = v_request.id;
  END IF;
END;
$$;

REVOKE ALL ON public.guard_override_requests FROM anon, PUBLIC;
REVOKE ALL ON public.guard_override_votes FROM anon, PUBLIC;
GRANT SELECT ON public.guard_override_requests TO authenticated;
GRANT SELECT ON public.guard_override_votes TO authenticated;
REVOKE ALL ON FUNCTION public.request_guard_override(uuid, integer, text) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.vote_guard_override(uuid, integer, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_guard_override(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vote_guard_override(uuid, integer, text) TO authenticated;

COMMIT;
