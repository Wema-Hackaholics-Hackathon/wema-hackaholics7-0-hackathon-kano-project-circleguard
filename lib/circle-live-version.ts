export type LiveCircleMember = {
  profile_id: string;
  status: string;
  payout_position: number | null;
};

export function circleLiveVersion(status: string, members: LiveCircleMember[]) {
  return JSON.stringify({
    status,
    members: members
      .map((member) => [member.profile_id, member.status, member.payout_position])
      .sort(([first], [second]) => String(first).localeCompare(String(second))),
  });
}
