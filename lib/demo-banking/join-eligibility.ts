import { analyzeAccountTrend } from "@/lib/open-banking/trend-engine";
import { getDemoProfile, transactionsForCycles } from "@/lib/demo-banking/profiles";

export type JoinEligibility = {
  status: "eligible" | "needs_protection" | "not_eligible";
  label: string;
  message: string;
};

export function checkJoinEligibility(profileKey: string, contributionAmount: number): JoinEligibility {
  const profile = getDemoProfile(profileKey);
  if (!profile || !Number.isFinite(contributionAmount) || contributionAmount <= 0) {
    return { status: "not_eligible", label: "Check unavailable", message: "Reconnect your bank account and try again." };
  }

  const trend = analyzeAccountTrend(
    transactionsForCycles(profile, contributionAmount, 0),
    "active",
    { contributionAmount, availableBalance: profile.openingBalance },
  );
  const remainingBalance = profile.openingBalance - contributionAmount;
  const burden = trend.contributionBurden ?? 1;

  if (remainingBalance <= 0 || burden > 0.5) {
    return {
      status: "not_eligible",
      label: "Not eligible for this circle",
      message: "This contribution would leave too little available money based on your connected account trend.",
    };
  }

  if (remainingBalance < contributionAmount || burden > 0.35 || trend.inflowTrend === "reducing") {
    return {
      status: "needs_protection",
      label: "Eligible with Guard protection",
      message: "You can join, but CircleGuard will monitor your payment readiness before each payout.",
    };
  }

  return {
    status: "eligible",
    label: "Eligible to join",
    message: "Your connected account trend can cover this contribution while retaining a balance.",
  };
}
