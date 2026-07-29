export type GuardOverride = {
  circleId: string;
  cycleNumber: number;
  beneficiaryId: string;
  reason: string;
  status: "requested" | "approved" | "rejected";
  votes: Record<string, "approve" | "reject">;
  requestedAt: string;
};

const storePath = join(tmpdir(), "circleguard-guard-overrides.json");
const temporaryStorePath = `${storePath}.tmp`;

function key(circleId: string, cycleNumber: number) { return `${circleId}:${cycleNumber}`; }

export function getGuardOverride(circleId: string, cycleNumber: number) {
  return readStore()[key(circleId, cycleNumber)];
}

export function requestGuardOverride(circleId: string, cycleNumber: number, beneficiaryId: string, reason: string) {
  const existing = getGuardOverride(circleId, cycleNumber);
  if (existing) return existing;
  const created: GuardOverride = { circleId, cycleNumber, beneficiaryId, reason, status: "requested", votes: {}, requestedAt: new Date().toISOString() };
  const store = readStore();
  store[key(circleId, cycleNumber)] = created;
  writeStore(store);
  return created;
}

export function voteOnGuardOverride(circleId: string, cycleNumber: number, voterId: string, vote: "approve" | "reject", eligibleVoters: number) {
  const current = getGuardOverride(circleId, cycleNumber);
  if (!current || current.status !== "requested") return current;
  current.votes[voterId] = vote;
  const approvals = Object.values(current.votes).filter((item) => item === "approve").length;
  const rejections = Object.values(current.votes).filter((item) => item === "reject").length;
  const required = Math.max(1, Math.floor(eligibleVoters / 2) + 1);
  if (approvals >= required) current.status = "approved";
  else if (rejections > eligibleVoters - required) current.status = "rejected";
  const store = readStore();
  store[key(circleId, cycleNumber)] = current;
  writeStore(store);
  return current;
}

export function isGuardOverrideApproved(circleId: string, cycleNumber: number) {
  return getGuardOverride(circleId, cycleNumber)?.status === "approved";
}

function readStore(): Record<string, GuardOverride> {
  if (!existsSync(storePath)) return {};
  try {
    return JSON.parse(readFileSync(storePath, "utf8")) as Record<string, GuardOverride>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, GuardOverride>) {
  writeFileSync(temporaryStorePath, JSON.stringify(store), "utf8");
  renameSync(temporaryStorePath, storePath);
}
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
