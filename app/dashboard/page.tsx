import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Clock3, MoreHorizontal, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { AppShell } from "@/components/app-shell";

const activity = [
  { title: "Contribution verified", detail: "Aisha Lawal · ₦50,000", time: "Today, 9:42 AM", tone: "green" },
  { title: "Payout review ready", detail: "Musa Bello · Cycle 3", time: "Today, 8:15 AM", tone: "amber" },
  { title: "Member joined", detail: "Fatima Yusuf joined Progress Circle", time: "Yesterday", tone: "gray" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const firstName = user?.user_metadata.full_name?.split(" ")[0] || "there";

  return (
    <AppShell>
      <main className="p-5 sm:p-7 xl:p-10">
        <div className="mx-auto max-w-[1120px]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-sm text-[#7b8782]">Wednesday, 29 July</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] sm:text-4xl">Good afternoon, {firstName}</h1><p className="mt-2 text-sm text-[#68746f]">Here’s what’s happening across your savings circles.</p></div>
            <Link href="/circles/new" className="hidden items-center gap-2 rounded-xl bg-[#123f31] px-4 py-3 text-sm font-semibold text-white sm:flex"><span className="text-lg leading-none">+</span> Create a circle</Link>
          </div>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <Metric label="Active circles" value="1" note="10 members" icon={<Users size={19} />} />
            <Metric label="Contributed this month" value="₦450,000" note="90% collected" icon={<Check size={19} />} progress />
            <Metric label="Next payout" value="₦500,000" note="Due 04 Aug 2026" icon={<CalendarDays size={19} />} />
          </section>

          <section className="mt-5 overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white shadow-[0_1px_2px_rgba(20,40,32,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e7eae8] px-5 py-4 sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b9691]">Action required</p><h2 className="mt-1 text-lg font-semibold">Upcoming payout review</h2></div><span className="rounded-full border border-[#f0d9a5] bg-[#fff8e8] px-3 py-1 text-xs font-semibold text-[#9b6915]">Protection recommended</span></div>
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e9f1ed] font-semibold text-[#123f31]">MB</div><div><h3 className="font-semibold">Musa Bello</h3><p className="mt-1 text-sm text-[#6d7974]">Scheduled recipient · Cycle 3 of 10</p><div className="mt-4 flex flex-wrap gap-x-7 gap-y-2 text-sm"><span><b className="font-semibold">₦500,000</b> payout</span><span><b className="font-semibold">7</b> contributions remain</span><span><b className="font-semibold">₦350,000</b> future obligation</span></div></div></div>
              <button className="flex items-center justify-center gap-2 rounded-xl bg-[#123f31] px-5 py-3 text-sm font-semibold text-white">Review payout <ArrowRight size={16} /></button>
            </div>
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
            <section className="overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white">
              <div className="flex items-center justify-between border-b border-[#e7eae8] px-5 py-4 sm:px-6"><div><h2 className="font-semibold">Progress Circle</h2><p className="mt-1 text-sm text-[#78847f]">Monthly · ₦50,000 per member</p></div><button aria-label="Circle options" className="grid size-9 place-items-center rounded-lg hover:bg-[#f2f4f3]"><MoreHorizontal size={19} /></button></div>
              <div className="p-5 sm:p-6"><div className="flex items-end justify-between"><div><p className="text-sm text-[#78847f]">Cycle 3 contributions</p><p className="mt-1 text-2xl font-semibold">₦450,000 <span className="text-sm font-normal text-[#8a9590]">of ₦500,000</span></p></div><span className="text-sm font-semibold text-[#23835f]">9 of 10 paid</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf0ee]"><div className="h-full w-[90%] rounded-full bg-[#2d9b70]" /></div>
                <div className="mt-6 grid grid-cols-3 divide-x divide-[#e7eae8] rounded-xl border border-[#e4e8e5] bg-[#fafbfa] py-4 text-center"><div><p className="text-xl font-semibold">10</p><p className="mt-1 text-xs text-[#7d8883]">Members</p></div><div><p className="text-xl font-semibold">04 Aug</p><p className="mt-1 text-xs text-[#7d8883]">Payout date</p></div><div><p className="text-xl font-semibold">8 mo</p><p className="mt-1 text-xs text-[#7d8883]">Remaining</p></div></div>
                <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dce2de] bg-white px-4 py-3 text-sm font-semibold hover:bg-[#f7f8f7]">View circle <ArrowRight size={15} /></button>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white">
              <div className="flex items-center justify-between border-b border-[#e7eae8] px-5 py-4"><div><h2 className="font-semibold">Recent activity</h2><p className="mt-1 text-sm text-[#78847f]">Latest circle updates</p></div><Clock3 size={18} className="text-[#78847f]" /></div>
              <div className="divide-y divide-[#edf0ee]">{activity.map((item) => <div key={item.title} className="flex gap-3 px-5 py-4"><span className={`mt-1 size-2.5 shrink-0 rounded-full ${item.tone === "green" ? "bg-[#2d9b70]" : item.tone === "amber" ? "bg-[#e1a738]" : "bg-[#abb4b0]"}`} /><div className="min-w-0"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 truncate text-xs text-[#74807b]">{item.detail}</p><p className="mt-1 text-[11px] text-[#a0aaa5]">{item.time}</p></div></div>)}</div>
              <button className="flex w-full items-center justify-center gap-2 border-t border-[#e7eae8] py-3.5 text-sm font-semibold text-[#365d4f]">View all activity <ArrowRight size={14} /></button>
            </section>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#dfe6e2] bg-[#f4f8f6] px-5 py-4 text-sm text-[#52615b]"><ShieldCheck size={20} className="shrink-0 text-[#277a5b]" /><p><b className="text-[#244638]">Open Banking sandbox:</b> Financial actions shown here are simulated. No real funds are moved.</p></div>
        </div>
      </main>
    </AppShell>
  );
}

function Metric({ label, value, note, icon, progress }: { label: string; value: string; note: string; icon: React.ReactNode; progress?: boolean }) {
  return <div className="rounded-2xl border border-[#e1e5e2] bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm text-[#74807b]">{label}</p><span className="grid size-9 place-items-center rounded-xl bg-[#eff3f1] text-[#315c4d]">{icon}</span></div><p className="mt-4 text-2xl font-semibold tracking-[-0.02em]">{value}</p>{progress && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf0ee]"><div className="h-full w-[90%] bg-[#2d9b70]" /></div>}<p className="mt-2 text-xs text-[#8b9691]">{note}</p></div>;
}
