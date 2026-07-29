export type GuardOverride = {
  circleId: string;
  cycleNumber: number;
  beneficiaryId: string;
  reason: string;
  status: "requested" | "approved" | "rejected";
  votes: Record<string, "approve" | "reject">;
  requestedAt: string;
};

const globalStore = globalThis as typeof globalThis & { __circleGuardOverrides?: Map<string, GuardOverride> };
const overrides = globalStore.__circleGuardOverrides ?? new Map<string, GuardOverride>();
globalStore.__circleGuardOverrides = overrides;

function key(circleId: string, cycleNumber: number) { return `${circleId}:${cycleNumber}`; }

export function getGuardOverride(circleId: string, cycleNumber: number) {
  return overrides.get(key(circleId, cycleNumber));
}

export function requestGuardOverride(circleId: string, cycleNumber: number, beneficiaryId: string, reason: string) {
  const existing = getGuardOverride(circleId, cycleNumber);
  if (existing) return existing;
  const created: GuardOverride = { circleId, cycleNumber, beneficiaryId, reason, status: "requested", votes: {}, requestedAt: new Date().toISOString() };
  overrides.set(key(circleId, cycleNumber), created);
  return created;
}

export function voteOnGuardOverride(circleId: string, cycleNumber: number, voterId: string, vote: "approve" | "reject", eligibleVoters: number) {
  const current = getGuardOverride(circleId, cycleNumber);
  if (!current || current.status !== "requested") return current;
  current.votes[voterId] = vote;
  const approvals = Object.values(current.votes).filter((item) => item === "approve").length;
  const rejections = Object.values(current.votes).filter((item) => item === "reject").length;
  const required = Math.max(1, Math.ceil(eligibleVoters * 0.75));
  if (approvals >= required) current.status = "approved";
  else if (rejections > eligibleVoters - required) current.status = "rejected";
  overrides.set(key(circleId, cycleNumber), current);
  return current;
}

export function isGuardOverrideApproved(circleId: string, cycleNumber: number) {
  return getGuardOverride(circleId, cycleNumber)?.status === "approved";
}
