create or replace function public.remove_circle_member(
  p_circle_id uuid,
  p_profile_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_circle_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_active_admin(p_circle_id, auth.uid()) then
    raise exception 'Only an active circle admin can remove members';
  end if;

  select status into v_circle_status
  from public.circles
  where id = p_circle_id
  for update;

  if v_circle_status not in ('draft', 'forming') then
    raise exception 'Members cannot be removed after the circle starts';
  end if;

  update public.circle_members
  set status = 'removed', payout_position = null
  where circle_id = p_circle_id
    and profile_id = p_profile_id
    and role = 'member'
    and status = 'active';

  if not found then
    raise exception 'Active member not found or cannot be removed';
  end if;

  return true;
end;
$$;

revoke all on function public.remove_circle_member(uuid, uuid) from public;
revoke all on function public.remove_circle_member(uuid, uuid) from anon;
grant execute on function public.remove_circle_member(uuid, uuid) to authenticated;
