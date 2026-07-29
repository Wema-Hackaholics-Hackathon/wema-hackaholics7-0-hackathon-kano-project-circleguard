import type { OpenBankingAdapter } from "./adapter";
import type { BankTransaction } from "./types";

export class MockOpenBankingAdapter implements OpenBankingAdapter {
  async requestConsent(memberId: string) {
    await wait(450);
    return {
      consentId: `sandbox-consent-${memberId.slice(0, 8)}`,
      verificationUrl: "https://auth.example.com/activate",
      status: "pending" as const,
    };
  }

  async getAccounts(_memberId: string, memberName: string) {
    await wait(500);
    return [{
      id: "sandbox-account-4821",
      bankName: "Open Banking Sandbox",
      accountName: memberName,
      maskedNumber: "•••• 4821",
      currency: "NGN" as const,
    }];
  }

  async getTransactions(_accountId: string, contributionAmount: number) {
    await wait(700);
    const now = new Date();
    const month = (offset: number, day: number) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, day, 9));
      return date.toISOString();
    };
    const transactions: BankTransaction[] = [
      inflow("inflow-1", 220000, month(-2, 24)),
      contribution("contribution-1", contributionAmount, "completed", month(-2, 28), month(-2, 28)),
      inflow("inflow-2", 195000, month(-1, 25)),
      contribution("contribution-2", contributionAmount, "completed", month(-1, 31), month(-1, 28)),
      inflow("inflow-3", 155000, month(0, 25)),
      contribution("contribution-3", contributionAmount, "completed", month(0, 28), month(0, 28)),
    ];
    return transactions;
  }

  async getMandateStatus(_memberId: string) {
    await wait(250);
    return "active" as const;
  }
}

function inflow(id: string, amount: number, occurredAt: string): BankTransaction {
  return { id, amount, direction: "credit", status: "completed", category: "inflow", reference: id.toUpperCase(), occurredAt };
}

function contribution(id: string, amount: number, status: "completed" | "failed", occurredAt: string, dueAt: string): BankTransaction {
  return { id, amount, direction: "debit", status, category: "contribution", reference: id.toUpperCase(), occurredAt, dueAt };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
