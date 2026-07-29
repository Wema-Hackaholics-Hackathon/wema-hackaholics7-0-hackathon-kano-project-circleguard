"use client";

import { useState } from "react";
import { FastForward, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function CycleSimulator({ circleId }: { circleId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [demoScenario, setDemoScenario] = useState("auto");
  async function simulate() {
    setLoading(true); setMessage("");
    const response = await fetch("/api/demo-banking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "simulate", circleId, demoScenario }) });
    const data = await response.json(); setLoading(false);
    if (!response.ok) return setMessage(data.error || "Could not simulate cycle.");
    setMessage(`Cycle ${data.cycleNumber} simulated for ${data.connectedMembers} connected member${data.connectedMembers === 1 ? "" : "s"}.`);
    router.refresh();
  }
  return <div className="flex flex-col items-start gap-2 sm:items-end"><div className="flex flex-nowrap gap-2"><label className="sr-only" htmlFor="demo-scenario">Demo scenario</label><select id="demo-scenario" value={demoScenario} onChange={(event) => setDemoScenario(event.target.value)} disabled={loading} className="w-[165px] rounded-xl border border-[#d8e1dc] bg-white px-3 py-2.5 text-sm font-semibold text-[#405048]"><option value="auto">Natural scenario</option><option value="green">Force Green Guard</option><option value="amber">Force Amber Guard</option><option value="red">Force Red Guard</option></select><button type="button" onClick={simulate} disabled={loading} className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#123f31] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{loading ? <LoaderCircle size={16} className="animate-spin" /> : <FastForward size={16} />}{loading ? "Simulating…" : "Simulate next cycle"}</button></div><p className="max-w-sm text-xs text-[#6f7b76]">The selected demo scenario applies only to the scheduled payout recipient.</p>{message && <p className="max-w-sm text-xs text-[#6f7b76]">{message}</p>}</div>;
}
