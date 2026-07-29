"use client";

import { useState } from "react";
import { ArrowRight, Check, Landmark, LoaderCircle, LockKeyhole, ShieldCheck, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import type { BankAccount, TrendResult } from "@/lib/open-banking/types";

export function OpenBankingDemo({ contributionAmount }: { contributionAmount: number }) {
  const [step, setStep] = useState<"permissions" | "consent" | "connected" | "result">("permissions");
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [trend, setTrend] = useState<TrendResult | null>(null);
  const [error, setError] = useState("");
  const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

  async function requestConsent() {
    setLoading(true); setError("");
    const response = await fetch("/api/open-banking/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "consent" }) });
    setLoading(false);
    if (!response.ok) return setError("Could not start sandbox consent.");
    setStep("consent");
  }

  async function approveAndAnalyze() {
    setLoading(true); setError("");
    const response = await fetch("/api/open-banking/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "analyze", contributionAmount }) });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data.error || "Could not connect the sandbox account.");
    setAccount(data.account); setTrend(data.trend); setStep("connected");
  }

  if (step === "result" && trend && account) return <Result account={account} trend={trend} money={money} />;

  return <section className="overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white">
    <div className="border-b border-[#e7eae8] px-6 py-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#edf4f0] text-[#286d52]"><Landmark size={20} /></span><div><h2 className="font-semibold">Connect your bank account</h2><p className="mt-1 text-sm text-[#78847f]">Open Banking Nigeria standards-compatible demo</p></div></div></div>
    <div className="p-6">
      {step === "permissions" && <><p className="text-sm leading-6 text-[#65716c]">CircleGuard needs limited, consented access to assess whether your contribution pattern can support future payments.</p><div className="mt-5 space-y-3"><Permission text="Read recent account inflow trends" /><Permission text="Verify agreed circle contributions" /><Permission text="Check your direct-debit mandate status" /></div><Privacy /></>}
      {step === "consent" && <div className="rounded-2xl border border-[#dbe4df] bg-[#f7faf8] p-6 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[#123f31] text-white"><LockKeyhole size={21} /></span><h3 className="mt-4 font-semibold">Sandbox consent request</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6d7974]">In production, your bank would open its own secure approval page. For this demo, approve the simulated consent below.</p></div>}
      {step === "connected" && account && <div><div className="flex items-center gap-4 rounded-2xl border border-[#d9e3de] bg-[#f7faf8] p-5"><span className="grid size-11 place-items-center rounded-xl bg-white text-[#286d52] shadow-sm"><WalletCards size={21} /></span><div><p className="font-semibold">{account.bankName}</p><p className="mt-1 text-sm text-[#75817c]">{account.accountName} · {account.maskedNumber}</p></div><span className="ml-auto rounded-full bg-[#e5f4ec] px-3 py-1 text-xs font-semibold text-[#247352]">Connected</span></div><p className="mt-5 text-sm leading-6 text-[#68746f]">The sandbox returned recent transactions. CircleGuard calculated the trend locally without showing raw transactions to the circle administrator.</p></div>}
      {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button onClick={step === "permissions" ? requestConsent : step === "consent" ? approveAndAnalyze : () => setStep("result")} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#123f31] px-5 py-3.5 font-semibold text-white disabled:opacity-60">{loading && <LoaderCircle size={17} className="animate-spin" />}{loading ? "Working…" : step === "permissions" ? "Continue to consent" : step === "consent" ? "Approve sandbox consent" : "View readiness analysis"}{!loading && <ArrowRight size={17} />}</button>
      <p className="mt-4 text-center text-xs text-[#909a95]">Sandbox simulation — no real bank account or funds are used.</p>
    </div>
  </section>;
}

function Permission({ text }: { text: string }) { return <div className="flex items-center gap-3 rounded-xl border border-[#e6e9e7] px-4 py-3 text-sm"><span className="grid size-6 place-items-center rounded-full bg-[#e7f4ed] text-[#267254]"><Check size={14} /></span>{text}</div>; }
function Privacy() { return <div className="mt-5 flex gap-3 rounded-xl border border-[#e3e7e5] bg-[#fafbfa] p-4 text-xs leading-5 text-[#74807b]"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#2b7659]" /><p>We never receive your bank password, PIN, OTP or card details. Other circle members cannot see your balance or transactions.</p></div>; }

function Result({ account, trend, money }: { account: BankAccount; trend: TrendResult; money: Intl.NumberFormat }) {
  const status = trend.readiness === "ready" ? "Ready" : trend.readiness === "protection_recommended" ? "Protection recommended" : "Action required";
  return <section className="overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white"><div className="border-b border-[#e7eae8] px-6 py-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87928d]">Payout readiness</p><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-semibold">{status}</h2><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${trend.readiness === "ready" ? "bg-[#e7f4ed] text-[#267254]" : "bg-[#fff5df] text-[#94630f]"}`}>Score {trend.score}/100</span></div></div><div className="p-6"><div className="grid gap-4 sm:grid-cols-3"><Stat label="Inflow trend" value={trend.inflowTrend} icon={trend.inflowTrend === "reducing" ? <TrendingDown size={18} /> : <TrendingUp size={18} />} /><Stat label="On-time rate" value={`${trend.onTimeRate}%`} icon={<Check size={18} />} /><Stat label="Mandate" value={trend.mandateStatus} icon={<ShieldCheck size={18} />} /></div><div className="mt-6"><h3 className="text-sm font-semibold">What influenced this result</h3><ul className="mt-3 space-y-2">{trend.reasons.map((reason) => <li key={reason} className="flex gap-2 text-sm text-[#65716c]"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#2b7659]" />{reason}</li>)}</ul></div><div className="mt-6 rounded-xl border border-[#e2e7e4] bg-[#fafbfa] p-4"><p className="text-xs text-[#7c8782]">Connected account</p><p className="mt-1 text-sm font-semibold">{account.bankName} · {account.maskedNumber}</p><p className="mt-3 text-xs text-[#8b9691]">Latest simulated monthly inflow: {money.format(trend.monthlyInflows.at(-1)?.amount ?? 0)}</p></div><Privacy /></div></section>;
}
function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-xl border border-[#e4e8e5] p-4"><span className="text-[#2b7659]">{icon}</span><p className="mt-3 text-xs text-[#7d8984]">{label}</p><p className="mt-1 font-semibold capitalize">{value.replaceAll("_", " ")}</p></div>; }
