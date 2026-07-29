"use client";

import { useState } from "react";
import { Check, LoaderCircle, ShieldAlert, X } from "lucide-react";

type OverrideView = { reason: string; status: "requested" | "approved" | "rejected"; approvals: number; rejections: number; requiredApprovals: number; currentUserVote: "approve" | "reject" | null; isBeneficiary: boolean };

export function GuardOverridePanel({ circleId, cycleNumber, riskLevel, fullPayout, initialOverride, initialViewerIsBeneficiary }: { circleId: string; cycleNumber: number; riskLevel: "green" | "amber" | "red"; fullPayout: string; initialOverride: OverrideView | null; initialViewerIsBeneficiary: boolean }) {
  const [override, setOverride] = useState<OverrideView | null>(initialOverride);
  const [viewerIsBeneficiary, setViewerIsBeneficiary] = useState(initialViewerIsBeneficiary);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    const response = await fetch(`/api/demo-banking/override?circleId=${circleId}&cycleNumber=${cycleNumber}`, { cache: "no-store" });
    const data = await response.json();
    if (response.ok) { setOverride(data.override); setViewerIsBeneficiary(Boolean(data.viewerIsBeneficiary)); }
    setLoading(false);
  }
  async function act(body: object) {
    setLoading(true); setError("");
    const response = await fetch("/api/demo-banking/override", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ circleId, cycleNumber, ...body }) });
    const data = await response.json(); setLoading(false);
    if (!response.ok) return setError(data.error || "Could not update the override.");
    setOverride(data.override); setViewerIsBeneficiary(Boolean(data.viewerIsBeneficiary));
  }
  if (riskLevel === "green") return null;
  return <div className="border-t border-black/5 px-5 py-4">
    {!override ? viewerIsBeneficiary ? <div><div className="flex items-start gap-3"><ShieldAlert size={18} className="mt-0.5 shrink-0" /><div><p className="text-sm font-semibold">Need the full payout?</p><p className="mt-1 text-xs leading-5 text-[#68766f]">Request an exception for the group to vote on. The admin cannot release it alone.</p></div></div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for requesting full release" maxLength={200} className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm" /><button onClick={() => act({ action: "request", reason })} disabled={loading} className="rounded-xl bg-[#172f26] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Request full release</button></div></div> : <p className="text-xs text-[#68766f]">The payout recipient can request a community vote for full release.</p> : <div><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">Full-release request · <span className="capitalize">{override.status}</span></p><p className="mt-1 text-xs text-[#68766f]">“{override.reason}”</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{override.approvals}/{override.requiredApprovals} approvals</span></div>{override.status === "requested" && !override.isBeneficiary && <div className="mt-3 flex gap-2"><button onClick={() => act({ action: "vote", vote: "approve" })} disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#235f49] px-4 py-2 text-sm font-semibold text-white"><Check size={15} /> Approve</button><button onClick={() => act({ action: "vote", vote: "reject" })} disabled={loading} className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold"><X size={15} /> Reject</button></div>}{override.currentUserVote && <p className="mt-2 text-xs capitalize text-[#68766f]">Your vote: {override.currentUserVote}</p>}{override.status === "approved" && <p className="mt-3 text-sm font-semibold text-[#235f49]">Community override approved. Guard reserve cancelled; {fullPayout} is authorised for full release.</p>}</div>}
    <button type="button" onClick={load} disabled={loading} className="mt-3 text-xs font-semibold text-[#365c4c]">Refresh votes</button>{loading && <LoaderCircle size={15} className="mt-3 animate-spin" />}{error && <p className="mt-3 text-xs text-red-600">{error}</p>}
  </div>;
}
