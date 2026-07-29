import type { BankTransaction, MandateStatus, TrendResult } from "./types";

export function analyzeAccountTrend(
  transactions: BankTransaction[],
  mandateStatus: MandateStatus,
  context: { contributionAmount?: number; availableBalance?: number } = {},
): TrendResult {
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
  const averageMonthlyInflow = monthlyInflows.length ? Math.round(monthlyInflows.reduce((total, month) => total + month.amount, 0) / monthlyInflows.length) : 0;
  const contributionAmount = context.contributionAmount ?? contributions.at(-1)?.amount ?? 0;
  const contributionBurden = contributionAmount > 0 && averageMonthlyInflow > 0 ? contributionAmount / averageMonthlyInflow : null;
  const balanceCoverage = contributionAmount > 0 && context.availableBalance !== undefined ? context.availableBalance / contributionAmount : null;

  const paymentPoints = contributions.length ? Math.round(onTimeRate * 0.3) : 18;
  const trendPoints = inflowTrend === "growing" ? 20 : inflowTrend === "stable" ? 16 : inflowTrend === "reducing" ? 6 : 8;
  const affordabilityPoints = contributionBurden === null ? 10 : contributionBurden <= 0.2 ? 20 : contributionBurden <= 0.35 ? 14 : contributionBurden <= 0.5 ? 8 : 2;
  const bufferPoints = balanceCoverage === null ? 8 : balanceCoverage >= 2 ? 15 : balanceCoverage >= 1 ? 10 : balanceCoverage >= 0.5 ? 5 : 0;
  const mandatePoints = mandateStatus === "active" ? 10 : 0;
  const reliabilityPoints = Math.max(0, 5 - failedContributions * 5);
  const score = Math.min(100, paymentPoints + trendPoints + affordabilityPoints + bufferPoints + mandatePoints + reliabilityPoints);

  const reasons: string[] = [];
  reasons.push(`Recent account inflows are ${inflowTrend === "insufficient_data" ? "not yet sufficient to assess" : inflowTrend}`);
  reasons.push(contributions.length ? `${onTime} of ${contributions.length} contributions were completed on time` : "No previous CircleGuard contribution history yet");
  if (contributionBurden !== null) reasons.push(`Contribution is ${Math.round(contributionBurden * 100)}% of average monthly inflow`);
  if (balanceCoverage !== null) reasons.push(`Current balance covers ${balanceCoverage.toFixed(1)} contribution${balanceCoverage >= 1.5 ? "s" : ""}`);
  reasons.push(`Contribution mandate is ${mandateStatus}`);
  if (failedContributions) reasons.push(`${failedContributions} contribution attempt${failedContributions === 1 ? "" : "s"} failed`);

  const readiness = mandateStatus !== "active"
    ? "action_required"
    : score >= 75
      ? "ready"
      : score >= 55
        ? "protection_recommended"
        : "action_required";

  return { inflowTrend, monthlyInflows, averageMonthlyInflow, contributionBurden, balanceCoverage, onTimeRate, completedContributions: completed.length, failedContributions, mandateStatus, score, readiness, reasons };
}
