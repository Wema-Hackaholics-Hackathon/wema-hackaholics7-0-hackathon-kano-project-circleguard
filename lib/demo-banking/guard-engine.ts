import type { TrendResult } from "@/lib/open-banking/types";

export type GuardRiskLevel = "green" | "amber" | "red";

export function guardRiskLevel(readiness?: TrendResult["readiness"]): GuardRiskLevel {
  return readiness === "ready" ? "green" : readiness === "protection_recommended" ? "amber" : "red";
}

export function guardProtectedCycles(riskLevel: GuardRiskLevel, cycleNumber: number) {
  const requested = riskLevel === "green" ? 0 : riskLevel === "amber" ? 1 : 2;
  return Math.min(requested, Math.max(8 - cycleNumber, 0));
}

export function guardExplanation(riskLevel: GuardRiskLevel, trend?: Pick<TrendResult, "inflowTrend" | "onTimeRate" | "failedContributions">) {
  if (riskLevel === "green") return "Full payout released because the recipient has healthy inflows and reliable contribution behaviour.";
  const signals = [
    trend?.inflowTrend === "reducing" ? "reducing account inflows" : null,
    trend && trend.onTimeRate < 80 ? `a ${trend.onTimeRate}% previous on-time rate` : null,
    trend?.failedContributions ? `${trend.failedContributions} previous failed contribution attempt${trend.failedContributions === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  const reason = signals.length ? signals.join(" and ") : "limited or irregular payment history";
  return riskLevel === "amber"
    ? `One future contribution is reserved because the recipient has ${reason}.`
    : `Two future contributions are reserved because the recipient has ${reason}.`;
}

export function payoutRecipient<T extends { payout_position: number | null }>(members: T[], cycleNumber: number) {
  const payoutPosition = ((cycleNumber - 1) % members.length) + 1;
  return members.find((member) => member.payout_position === payoutPosition) ?? members[payoutPosition - 1];
}
