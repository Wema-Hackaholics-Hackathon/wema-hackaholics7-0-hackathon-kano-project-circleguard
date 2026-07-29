import type { BankTransaction } from "@/lib/open-banking/types";

export type ContributionOutcome = "early" | "on_time" | "late" | "failed";

export type DemoBankProfile = {
  key: string;
  name: string;
  bankName: string;
  accountNumber: string;
  occupation: string;
  openingBalance: number;
  inflows: number[];
  outcomes: ContributionOutcome[];
};

export const demoBankProfiles: DemoBankProfile[] = [
  { key: "aisha", name: "Aisha Bello", bankName: "ALAT by Wema", accountNumber: "1000000001", occupation: "Product designer", openingBalance: 184500, inflows: [280000,280000,285000,285000,290000,290000,295000,295000], outcomes: ["on_time","early","on_time","on_time","early","on_time","on_time","early"] },
  { key: "tunde", name: "Tunde Adeyemi", bankName: "Demo Enterprise Bank", accountNumber: "1000000002", occupation: "Retail business owner", openingBalance: 96000, inflows: [210000,145000,260000,170000,235000,155000,245000,190000], outcomes: ["on_time","late","on_time","late","on_time","on_time","late","on_time"] },
  { key: "musa", name: "Musa Ibrahim", bankName: "Demo Community Bank", accountNumber: "1000000003", occupation: "Logistics operator", openingBalance: 12500, inflows: [210000,175000,140000,105000,80000,60000,45000,35000], outcomes: ["on_time","late","late","failed","failed","late","failed","failed"] },
  { key: "zainab", name: "Zainab Yusuf", bankName: "Demo Trust Bank", accountNumber: "1000000004", occupation: "Caterer", openingBalance: 48000, inflows: [150000,155000,148000,152000,150000,158000,151000,155000], outcomes: ["on_time","failed","on_time","failed","late","on_time","failed","on_time"] },
  { key: "chinedu", name: "Chinedu Okafor", bankName: "Demo Metro Bank", accountNumber: "1000000005", occupation: "Sales manager", openingBalance: 72000, inflows: [360000,360000,370000,370000,380000,380000,390000,390000], outcomes: ["late","late","on_time","late","on_time","late","on_time","late"] },
  { key: "fatima", name: "Fatima Lawal", bankName: "ALAT by Wema", accountNumber: "1000000006", occupation: "Pharmacist", openingBalance: 265000, inflows: [320000,320000,325000,325000,330000,330000,335000,335000], outcomes: ["early","on_time","early","on_time","early","on_time","early","on_time"] },
  { key: "emeka", name: "Emeka Nwosu", bankName: "Demo Digital Bank", accountNumber: "1000000007", occupation: "Freelance developer", openingBalance: 61000, inflows: [90000,310000,75000,260000,110000,290000,80000,240000], outcomes: ["late","on_time","late","on_time","failed","on_time","late","on_time"] },
  { key: "kemi", name: "Kemi Balogun", bankName: "Demo Heritage Bank", accountNumber: "1000000008", occupation: "Teacher", openingBalance: 118000, inflows: [195000,195000,195000,200000,200000,205000,205000,210000], outcomes: ["on_time","on_time","on_time","early","on_time","on_time","early","on_time"] },
];

export function getDemoProfile(key: string) {
  return demoBankProfiles.find((profile) => profile.key === key);
}

export function transactionsForCycles(profile: DemoBankProfile, contributionAmount: number, cycleCount: number) {
  const transactions: BankTransaction[] = [];
  const count = Math.max(1, Math.min(cycleCount, profile.inflows.length));
  const today = new Date();
  for (let index = 0; index < count; index += 1) {
    const monthOffset = index - count + 1;
    const inflowDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + monthOffset, 24, 9));
    const dueDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + monthOffset, 28, 18));
    const outcome = profile.outcomes[index];
    transactions.push({ id: `${profile.key}-inflow-${index + 1}`, amount: profile.inflows[index], direction: "credit", status: "completed", category: "inflow", reference: `INFLOW-${profile.key}-${index + 1}`, occurredAt: inflowDate.toISOString() });
    const paidDate = new Date(dueDate);
    paidDate.setUTCDate(paidDate.getUTCDate() + (outcome === "early" ? -2 : outcome === "late" ? 3 : 0));
    transactions.push({ id: `${profile.key}-contribution-${index + 1}`, amount: contributionAmount, direction: "debit", status: outcome === "failed" ? "failed" : "completed", category: "contribution", reference: `CONTRIB-${profile.key}-${index + 1}`, occurredAt: paidDate.toISOString(), dueAt: dueDate.toISOString() });
  }
  return transactions;
}
