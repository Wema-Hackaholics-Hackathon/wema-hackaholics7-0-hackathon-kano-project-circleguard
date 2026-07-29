import Link from "next/link";
import { ArrowRight, CalendarDays, CircleDollarSign, Plus, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/utils/supabase/server";

type Circle = {
  id: string;
  name: string;
  contribution_amount: number;
  frequency: "weekly" | "monthly";
  member_limit: number;
  start_date: string;
  status: string;
};

export default async function CirclesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("circles")
    .select("id,name,contribution_amount,frequency,member_limit,start_date,status")
    .order("created_at", { ascending: false });
  const circles = (data ?? []) as Circle[];
  const money = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });

  return (
    <AppShell active="My circles">
      <main className="p-5 sm:p-7 xl:p-10">
        <div className="mx-auto max-w-[1080px]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-sm font-semibold text-[#2b7659]">SAVINGS CIRCLES</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">My circles</h1><p className="mt-2 text-sm text-[#6f7b76]">Manage the circles you created or joined.</p></div>
            <Link href="/circles/new" className="flex items-center justify-center gap-2 rounded-xl bg-[#123f31] px-4 py-3 text-sm font-semibold text-white"><Plus size={17} /> Create a circle</Link>
          </div>

          {circles.length === 0 ? (
            <section className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-[#ccd6d1] bg-white px-5 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-[#edf4f0] text-[#2b7659]"><CircleDollarSign size={25} /></span>
              <h2 className="mt-5 text-xl font-semibold">No circles yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#74807b]">Create your first ajo or accept a private invitation from another administrator.</p>
              <Link href="/circles/new" className="mt-6 flex items-center gap-2 rounded-xl bg-[#123f31] px-5 py-3 text-sm font-semibold text-white"><Plus size={16} /> Create your first circle</Link>
            </section>
          ) : (
            <section className="mt-8 grid gap-5 lg:grid-cols-2">
              {circles.map((circle) => {
                const payout = Number(circle.contribution_amount) * circle.member_limit;
                return <Link key={circle.id} href={`/circles/${circle.id}`} className="group overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white hover:border-[#bdccc5] hover:shadow-[0_12px_35px_rgba(20,48,37,0.07)]">
                  <div className="flex items-start justify-between border-b border-[#e9ecea] p-5"><div><span className="rounded-full border border-[#d5e5dd] bg-[#f1f7f4] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#2a7156]">{circle.status}</span><h2 className="mt-3 text-xl font-semibold">{circle.name}</h2><p className="mt-1 text-sm capitalize text-[#78847f]">{circle.frequency} contributions</p></div><ArrowRight size={19} className="mt-1 text-[#9ba59f] transition group-hover:translate-x-1 group-hover:text-[#2b7659]" /></div>
                  <div className="grid grid-cols-2 gap-4 p-5 text-sm"><Info icon={<CircleDollarSign size={16} />} label="Contribution" value={money.format(circle.contribution_amount)} /><Info icon={<Users size={16} />} label="Members" value={`Up to ${circle.member_limit}`} /><Info icon={<CalendarDays size={16} />} label="Starts" value={new Date(`${circle.start_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} /><Info icon={<CircleDollarSign size={16} />} label="Cycle payout" value={money.format(payout)} /></div>
                </Link>;
              })}
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div><p className="flex items-center gap-2 text-xs text-[#89948f]">{icon}{label}</p><p className="mt-1.5 font-semibold">{value}</p></div>;
}
