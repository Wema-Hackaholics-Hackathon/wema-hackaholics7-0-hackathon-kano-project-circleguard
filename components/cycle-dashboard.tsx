import { AlertTriangle, CheckCircle2, Clock3, TrendingUp } from "lucide-react";
import { CycleSimulator } from "@/components/cycle-simulator";

type Cycle = { id: string; cycle_number: number; due_date: string };
type Assessment = {
  cycle_id: string;
  profile_id: string;
  score: number;
  readiness: "ready" | "protection_recommended" | "action_required";
  inflow_trend: string;
  on_time_rate: number;
};
type Contribution = {
  cycle_id: string;
  profile_id: string;
  outcome: "early" | "on_time" | "late" | "failed";
};

export function CycleDashboard({
  circleId,
  isAdmin,
  memberCount,
  cycles,
  assessments,
  contributions,
  memberNames,
}: {
  circleId: string;
  isAdmin: boolean;
  memberCount: number;
  cycles: Cycle[];
  assessments: Assessment[];
  contributions: Contribution[];
  memberNames: Record<string, string>;
}) {
  const latestCycle = cycles[0];
  const latestAssessments = latestCycle
    ? assessments.filter((item) => item.cycle_id === latestCycle.id)
    : [];

  return <section className="mt-5 overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white">
    <div className="flex flex-col justify-between gap-4 border-b border-[#e7eae8] px-6 py-5 sm:flex-row sm:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2b7659]">Cycle intelligence</p>
        <h2 className="mt-1 font-semibold">Payment readiness simulation</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#78847f]">Each simulation predicts from earlier cycles, then reveals new payment data that affects the next cycle.</p>
      </div>
      {isAdmin && <CycleSimulator circleId={circleId} />}
    </div>

    {!latestCycle ? <div className="px-6 py-10 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-full bg-[#edf4f0] text-[#2b7659]"><TrendingUp size={20} /></span>
      <h3 className="mt-3 font-semibold">No cycle simulated yet</h3>
      <p className="mt-1 text-sm text-[#78847f]">The first cycle establishes payment history. Later predictions will change as new behaviour is revealed.</p>
    </div> : <>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#fafbfa] px-6 py-3 text-sm">
        <span className="font-semibold">Latest result · Cycle {latestCycle.cycle_number}</span>
        <span className="text-[#78847f]">Due {formatDate(latestCycle.due_date)}</span>
      </div>
      <div className="divide-y divide-[#edf0ee]">
        {latestAssessments.map((assessment) => {
          const contribution = contributions.find((item) => item.cycle_id === latestCycle.id && item.profile_id === assessment.profile_id);
          const display = readinessDisplay(assessment.readiness);
          return <div key={assessment.profile_id} className="grid gap-3 px-6 py-4 sm:grid-cols-[1.3fr_1fr_1fr] sm:items-center">
            <div>
              <p className="font-semibold">{memberNames[assessment.profile_id] ?? "Circle member"}</p>
              <p className="mt-1 text-xs capitalize text-[#78847f]">Inflows: {assessment.inflow_trend.replaceAll("_", " ")} · {latestCycle.cycle_number === 1 ? "No previous circle payments" : `Previous on-time rate: ${assessment.on_time_rate}%`}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`grid size-8 place-items-center rounded-full ${display.className}`}>{display.icon}</span>
              <div><p className="text-xs text-[#7b8781]">Prediction</p><p className="text-sm font-semibold">{display.label} · {assessment.score}/100</p></div>
            </div>
            <div className="sm:text-right"><p className="text-xs text-[#7b8781]">Actual payment</p><p className={`mt-1 text-sm font-semibold capitalize ${contribution?.outcome === "failed" ? "text-red-600" : "text-[#235f49]"}`}>{contribution ? contribution.outcome.replaceAll("_", " ") : "Not recorded"}</p></div>
          </div>;
        })}
      </div>
      <div className="flex flex-wrap justify-between gap-2 border-t border-[#edf0ee] px-6 py-3 text-xs text-[#7b8781]"><span>Cycle {cycles.length} of 8 simulated</span><span>{latestAssessments.length} of {memberCount} members assessed this cycle</span></div>
    </>}
  </section>;
}

function readinessDisplay(readiness: Assessment["readiness"]) {
  if (readiness === "ready") return { label: "Ready", className: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 size={16} /> };
  if (readiness === "protection_recommended") return { label: "At risk", className: "bg-amber-50 text-amber-700", icon: <Clock3 size={16} /> };
  return { label: "Likely to default", className: "bg-red-50 text-red-700", icon: <AlertTriangle size={16} /> };
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
