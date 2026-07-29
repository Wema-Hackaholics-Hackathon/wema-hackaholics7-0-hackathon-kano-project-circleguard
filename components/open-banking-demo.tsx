"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Landmark, LoaderCircle, LockKeyhole, ShieldCheck, TrendingDown, TrendingUp, Unplug, WalletCards } from "lucide-react";
import type { TrendResult } from "@/lib/open-banking/types";

type PublicProfile = { key: string; name: string; bankName: string; accountNumber: string; occupation: string; openingBalance: number };
type ConnectedProfile = { key: string; name: string; bankName: string; occupation: string; maskedNumber: string; availableBalance: number };

export function OpenBankingDemo({ circleId, contributionAmount, nextPath }: { circleId?: string; contributionAmount: number; nextPath?: string }) {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [selected, setSelected] = useState("");
  const [step, setStep] = useState<"select" | "consent" | "connected" | "result">("select");
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [profile, setProfile] = useState<ConnectedProfile | null>(null);
  const [trend, setTrend] = useState<TrendResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/demo-banking${circleId ? `?circleId=${encodeURIComponent(circleId)}` : ""}`);
        const data = await response.json();
        setProfiles(data.profiles ?? []);
        if (data.connectedProfileKey) {
          setSelected(data.connectedProfileKey);
          const analyzed = await post({ action: "analyze", circleId, contributionAmount });
          if (analyzed.ok) { setProfile(analyzed.data.profile); setTrend(analyzed.data.trend); setStep("connected"); }
        }
      } catch { setError("Could not load demo accounts."); }
      finally { setLoadingAccounts(false); }
    }
    load();
  }, [circleId, contributionAmount]);

  async function connectAndAnalyze() {
    setLoading(true); setError("");
    const connected = await post({ action: "connect", circleId, profileKey: selected });
    if (!connected.ok) { setLoading(false); return setError(connected.data.error || "Could not connect demo account."); }
    if (nextPath) { window.location.href = nextPath; return; }
    const analyzed = await post({ action: "analyze", circleId, contributionAmount });
    setLoading(false);
    if (!analyzed.ok) return setError(analyzed.data.error || "Could not analyze demo account.");
    setProfile(analyzed.data.profile); setTrend(analyzed.data.trend); setStep("connected");
  }

  async function disconnect() {
    if (!window.confirm("Disconnect this demo bank account? Your previous cycle history will remain saved.")) return;
    setLoading(true); setError("");
    const result = await post({ action: "disconnect", circleId });
    setLoading(false);
    if (!result.ok) return setError(result.data.error || "Could not disconnect demo account.");
    setProfile(null); setTrend(null); setSelected(""); setStep("select");
  }

  if (step === "result" && trend && profile) return <Result profile={profile} trend={trend} />;

  return <section className="overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white">
    <div className="border-b border-[#e7eae8] px-6 py-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#edf4f0] text-[#286d52]"><Landmark size={20} /></span><div><h2 className="font-semibold">Connect a demo bank account</h2><p className="mt-1 text-sm text-[#78847f]">Simulated profiles using the Open Banking Nigeria structure</p></div></div></div>
    <div className="p-6">
      {step === "select" && <><p className="text-sm leading-6 text-[#65716c]">Choose a fictional bank customer for this CircleGuard user. This private connection will be reused across their circles.</p>{loadingAccounts ? <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-[#e3e7e5] p-8 text-sm text-[#73807a]"><LoaderCircle size={17} className="animate-spin" /> Loading demo accounts…</div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{profiles.map((item) => <button type="button" key={item.key} onClick={() => setSelected(item.key)} disabled={loading} className={`rounded-xl border p-4 text-left transition disabled:cursor-wait disabled:opacity-60 ${selected === item.key ? "border-[#2b7659] bg-[#f1f7f4] ring-1 ring-[#2b7659]" : "border-[#e3e7e5] hover:bg-[#fafbfa]"}`}><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-[#73807a]">{item.bankName} · •••• {item.accountNumber.slice(-4)}</p><p className="mt-2 text-xs text-[#88938e]">{item.occupation}</p></button>)}</div>}</>}
      {step === "consent" && <div className="rounded-2xl border border-[#dbe4df] bg-[#f7faf8] p-6 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[#123f31] text-white"><LockKeyhole size={21} /></span><h3 className="mt-4 font-semibold">Approve demo consent</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6d7974]">Allow CircleGuard to read this fictional account’s balance and transaction history for the readiness demonstration.</p></div>}
      {step === "connected" && profile && <div><div className="flex items-center gap-4 rounded-2xl border border-[#d9e3de] bg-[#f7faf8] p-5"><span className="grid size-11 place-items-center rounded-xl bg-white text-[#286d52] shadow-sm"><WalletCards size={21} /></span><div><p className="font-semibold">{profile.bankName}</p><p className="mt-1 text-sm text-[#75817c]">{profile.name} · {profile.maskedNumber}</p></div><span className="ml-auto rounded-full bg-[#e5f4ec] px-3 py-1 text-xs font-semibold text-[#247352]">Connected</span></div><div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><p className="text-sm leading-6 text-[#68746f]">This account will participate in future simulated cycles.</p><button type="button" onClick={disconnect} disabled={loading} aria-busy={loading} className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60">{loading ? <LoaderCircle size={15} className="animate-spin" /> : <Unplug size={15} />}{loading ? "Disconnecting…" : "Disconnect"}</button></div></div>}
      {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="button" onClick={step === "select" ? () => selected ? setStep("consent") : setError("Choose a demo account first.") : step === "consent" ? connectAndAnalyze : () => setStep("result")} disabled={loading || loadingAccounts} aria-busy={loading || loadingAccounts} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#123f31] px-5 py-3.5 font-semibold text-white disabled:cursor-wait disabled:opacity-60">{(loading || loadingAccounts) && <LoaderCircle size={17} className="animate-spin" />}{loadingAccounts ? "Loading accounts…" : loading ? "Connecting…" : step === "select" ? "Continue to consent" : step === "consent" ? "Approve and connect" : "View readiness analysis"}{!loading && !loadingAccounts && <ArrowRight size={17} />}</button>
      <p className="mt-4 text-center text-xs text-[#909a95]">Fictional accounts and funds · Open Banking Nigeria-compatible demo data</p>
    </div>
  </section>;
}

async function post(body: Record<string, unknown>) { const response = await fetch("/api/demo-banking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return { ok: response.ok, data: await response.json() }; }

function Result({ profile, trend }: { profile: ConnectedProfile; trend: TrendResult }) {
  const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
  const status = trend.readiness === "ready" ? "Ready" : trend.readiness === "protection_recommended" ? "Protection recommended" : "Action required";
  return <section className="overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white"><div className="border-b border-[#e7eae8] px-6 py-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87928d]">Payout readiness</p><div className="mt-3 flex items-center justify-between gap-3"><h2 className="text-2xl font-semibold">{status}</h2><span className="rounded-full bg-[#edf4f0] px-3 py-1.5 text-xs font-semibold text-[#286d52]">Score {trend.score}/100</span></div></div><div className="p-6"><div className="grid gap-4 sm:grid-cols-3"><Stat label="Inflow trend" value={trend.inflowTrend} icon={trend.inflowTrend === "reducing" ? <TrendingDown size={18} /> : <TrendingUp size={18} />} /><Stat label="On-time rate" value={`${trend.onTimeRate}%`} icon={<Check size={18} />} /><Stat label="Mandate" value={trend.mandateStatus} icon={<ShieldCheck size={18} />} /></div><div className="mt-6"><h3 className="text-sm font-semibold">What influenced this result</h3><ul className="mt-3 space-y-2">{trend.reasons.map((reason) => <li key={reason} className="flex gap-2 text-sm text-[#65716c]"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#2b7659]" />{reason}</li>)}</ul></div><div className="mt-6 rounded-xl border border-[#e2e7e4] bg-[#fafbfa] p-4"><p className="text-xs text-[#7c8782]">Connected demo account</p><p className="mt-1 text-sm font-semibold">{profile.bankName} · {profile.maskedNumber}</p><p className="mt-2 text-sm text-[#65716c]">Starting balance: {money.format(profile.availableBalance)}</p></div></div></section>;
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-xl border border-[#e4e8e5] p-4"><span className="text-[#2b7659]">{icon}</span><p className="mt-3 text-xs text-[#7d8984]">{label}</p><p className="mt-1 font-semibold capitalize">{value.replaceAll("_", " ")}</p></div>; }
