"use client";

import { useState } from "react";
import { FastForward, LoaderCircle } from "lucide-react";

export function CycleSimulator({ circleId }: { circleId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function simulate() {
    setLoading(true); setMessage("");
    const response = await fetch("/api/demo-banking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "simulate", circleId }) });
    const data = await response.json(); setLoading(false);
    if (!response.ok) return setMessage(data.error || "Could not simulate cycle.");
    setMessage(`Cycle ${data.cycleNumber} simulated for ${data.connectedMembers} connected member${data.connectedMembers === 1 ? "" : "s"}.`);
    window.location.reload();
  }
  return <div className="flex flex-col items-start gap-2 sm:items-end"><button type="button" onClick={simulate} disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#123f31] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{loading ? <LoaderCircle size={16} className="animate-spin" /> : <FastForward size={16} />}{loading ? "Simulating…" : "Simulate next cycle"}</button>{message && <p className="max-w-sm text-xs text-[#6f7b76]">{message}</p>}</div>;
}
