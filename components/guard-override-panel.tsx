"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, LoaderCircle, ShieldAlert, X } from "lucide-react";

type OverrideView = { reason: string; status: "requested" | "approved" | "rejected"; approvals: number; rejections: number; requiredApprovals: number; currentUserVote: "approve" | "reject" | null; isBeneficiary: boolean };
type OverrideAction = { action: "request"; reason: string } | { action: "vote"; vote: "approve" | "reject" };

export function GuardOverridePanel({ circleId, cycleNumber, riskLevel, fullPayout, initialOverride, initialViewerIsBeneficiary }: { circleId: string; cycleNumber: number; riskLevel: "green" | "amber" | "red"; fullPayout: string; initialOverride: OverrideView | null; initialViewerIsBeneficiary: boolean }) {
  const [override, setOverride] = useState<OverrideView | null>(initialOverride);
  const [viewerIsBeneficiary, setViewerIsBeneficiary] = useState(initialViewerIsBeneficiary);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"request" | "approve" | "reject" | "refresh" | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (silent = true) => {
    if (!silent) { setLoading(true); setLoadingAction("refresh"); }
    try {
      const response = await fetch(`/api/demo-banking/override?circleId=${circleId}&cycleNumber=${cycleNumber}`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok) { setOverride(data.override); setViewerIsBeneficiary(Boolean(data.viewerIsBeneficiary)); }
      else if (!silent) setError(data.error || "Could not refresh votes.");
    } catch {
      if (!silent) setError("Could not refresh votes.");
    } finally {
      if (!silent) { setLoading(false); setLoadingAction(null); }
    }
  }, [circleId, cycleNumber]);

  useEffect(() => {
    if (riskLevel === "green") return;
    const initialLoad = window.setTimeout(() => { void load(true); }, 0);
    const interval = window.setInterval(() => { void load(true); }, 2000);
    return () => { window.clearTimeout(initialLoad); window.clearInterval(interval); };
  }, [load, riskLevel]);

  async function act(body: OverrideAction) {
    setLoading(true);
    setLoadingAction(body.action === "request" ? "request" : body.vote);
    setError("");
    try {
      const response = await fetch("/api/demo-banking/override", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ circleId, cycleNumber, ...body }) });
      const data = await response.json();
      if (!response.ok) return setError(data.error || "Could not update the request.");
      setOverride(data.override);
      setViewerIsBeneficiary(Boolean(data.viewerIsBeneficiary));
    } catch {
      setError("Could not update the request.");
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  }

  if (riskLevel === "green") return null;
  return <div className="border-t border-black/5 px-5 py-4">
    {!override ? viewerIsBeneficiary ? <div>
      <div className="flex items-start gap-3"><ShieldAlert size={18} className="mt-0.5 shrink-0" /><div><p className="text-sm font-semibold">Need the full payout?</p><p className="mt-1 text-xs leading-5 text-[#68766f]">Request an exception for the group to vote on. The admin cannot release it alone.</p></div></div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={reason} onChange={(event) => setReason(event.target.value)} disabled={loading} placeholder="Reason for requesting full release" maxLength={200} className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm disabled:opacity-60" /><button onClick={() => act({ action: "request", reason })} disabled={loading} aria-busy={loadingAction === "request"} className="flex items-center justify-center gap-2 rounded-xl bg-[#172f26] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{loadingAction === "request" && <LoaderCircle size={15} className="animate-spin" />}{loadingAction === "request" ? "Requesting…" : "Request full release"}</button></div>
    </div> : <p className="text-xs text-[#68766f]">The payout recipient can request a community vote for full release.</p> : <div>
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">Full-release request · <span className="capitalize">{override.status}</span></p><p className="mt-1 text-xs text-[#68766f]">“{override.reason}”</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{override.approvals}/{override.requiredApprovals} approvals</span></div>
      {override.status === "requested" && !override.isBeneficiary && !override.currentUserVote && <div className="mt-3 flex gap-2"><button onClick={() => act({ action: "vote", vote: "approve" })} disabled={loading} aria-busy={loadingAction === "approve"} className="flex items-center gap-2 rounded-xl bg-[#235f49] px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{loadingAction === "approve" ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />}{loadingAction === "approve" ? "Approving…" : "Approve"}</button><button onClick={() => act({ action: "vote", vote: "reject" })} disabled={loading} aria-busy={loadingAction === "reject"} className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-wait disabled:opacity-60">{loadingAction === "reject" ? <LoaderCircle size={15} className="animate-spin" /> : <X size={15} />}{loadingAction === "reject" ? "Rejecting…" : "Reject"}</button></div>}
      {override.status === "requested" && override.currentUserVote && <p className="mt-2 text-xs capitalize text-[#68766f]">Your vote: {override.currentUserVote}</p>}
      {override.status === "approved" && <p className="mt-3 text-sm font-semibold text-[#235f49]">Full payout released automatically. Guard reserve cancelled; {fullPayout} has been given to the recipient.</p>}
      {override.status === "rejected" && <p className="mt-3 text-sm font-semibold text-[#8a4b20]">The request was not approved. The Guard reserve remains active.</p>}
    </div>}
    <button type="button" onClick={() => void load(false)} disabled={loading} aria-busy={loadingAction === "refresh"} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#365c4c] disabled:cursor-wait disabled:opacity-60">{loadingAction === "refresh" && <LoaderCircle size={14} className="animate-spin" />}{loadingAction === "refresh" ? "Refreshing…" : "Refresh votes"}</button>
    {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
  </div>;
}
