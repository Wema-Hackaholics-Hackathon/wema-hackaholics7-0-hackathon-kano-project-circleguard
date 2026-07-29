import type { BankTransaction, MandateStatus, TrendResult } from "./types";

export function analyzeAccountTrend(transactions: BankTransaction[], mandateStatus: MandateStatus): TrendResult {
  const inflows = transactions.filter((transaction) => transaction.category === "inflow" && transaction.direction === "credit" && transaction.status === "completed");
  const monthlyMap = new Map<string, number>();
  for (const transaction of inflows) {
    const key = transaction.occurredAt.slice(0, 7);
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + transaction.amount);
  }
  const monthlyInflows = [...monthlyMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => ({ month, amount }));
  const first = monthlyInflows[0]?.amount ?? 0;
  const latest = monthlyInflows.at(-1)?.amount ?? 0;
  const change = first > 0 ? (latest - first) / first : 0;
  const inflowTrend = monthlyInflows.length < 2 ? "insufficient_data" : change <= -0.15 ? "reducing" : change >= 0.15 ? "growing" : "stable";

  const contributions = transactions.filter((transaction) => transaction.category === "contribution");
  const completed = contributions.filter((transaction) => transaction.status === "completed");
  const failedContributions = contributions.filter((transaction) => transaction.status === "failed").length;
  const onTime = completed.filter((transaction) => !transaction.dueAt || new Date(transaction.occurredAt) <= new Date(transaction.dueAt)).length;
  const onTimeRate = contributions.length ? Math.round((onTime / contributions.length) * 100) : 0;

  const paymentPoints = Math.round(onTimeRate * 0.4);
  const trendPoints = inflowTrend === "growing" ? 25 : inflowTrend === "stable" ? 20 : inflowTrend === "reducing" ? 10 : 5;
  const mandatePoints = mandateStatus === "active" ? 20 : 0;
  const failurePoints = Math.max(0, 15 - failedContributions * 8);
  const score = Math.min(100, paymentPoints + trendPoints + mandatePoints + failurePoints);

  const reasons: string[] = [];
  reasons.push(`Recent account inflows are ${inflowTrend === "insufficient_data" ? "not yet sufficient to assess" : inflowTrend}`);
  reasons.push(`${onTime} of ${contributions.length} contributions were completed on time`);
  reasons.push(`Contribution mandate is ${mandateStatus}`);
  if (failedContributions) reasons.push(`${failedContributions} contribution attempt${failedContributions === 1 ? "" : "s"} failed`);

  const readiness = mandateStatus !== "active" || !completed.length
    ? "action_required"
    : score >= 85
      ? "ready"
      : "protection_recommended";

  return { inflowTrend, monthlyInflows, onTimeRate, completedContributions: completed.length, failedContributions, mandateStatus, score, readiness, reasons };
}
