import type { BankAccount, BankTransaction, ConsentResult, MandateStatus } from "./types";

export interface OpenBankingAdapter {
  requestConsent(memberId: string): Promise<ConsentResult>;
  getAccounts(memberId: string, memberName: string): Promise<BankAccount[]>;
  getTransactions(accountId: string, contributionAmount: number): Promise<BankTransaction[]>;
  getMandateStatus(memberId: string): Promise<MandateStatus>;
}
