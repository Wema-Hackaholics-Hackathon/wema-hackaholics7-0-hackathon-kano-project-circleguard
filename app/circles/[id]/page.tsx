import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/utils/supabase/server";

export default async function CirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: circle } = await supabase.from("circles").select("*").eq("id", id).single();
  if (!circle) notFound();
  const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
  const payout = Number(circle.contribution_amount) * circle.member_limit;

  return <AppShell active="My circles"><main className="p-5 sm:p-7 xl:p-10"><div className="mx-auto max-w-[1050px]">
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[#66736d]"><ArrowLeft size={16} /> Back to overview</Link>
    <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="rounded-full border border-[#cfe2d8] bg-[#eff7f3] px-3 py-1 text-xs font-semibold capitalize text-[#277255]">{circle.status}</span><h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{circle.name}</h1><p className="mt-2 text-sm text-[#6f7b76]">{circle.frequency} savings circle · Starts {new Date(`${circle.start_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p></div></div>
    <section className="mt-8 grid gap-4 sm:grid-cols-3"><Card label="Contribution" value={money.format(circle.contribution_amount)} /><Card label="Payout per cycle" value={money.format(payout)} /><Card label="Members" value={`1 of ${circle.member_limit}`} /></section>
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white"><div className="border-b border-[#e7eae8] px-6 py-4"><h2 className="font-semibold">Invite your members</h2><p className="mt-1 text-sm text-[#78847f]">Fill the remaining {circle.member_limit - 1} spots to start this circle.</p></div><div className="p-6"><div className="flex flex-col items-center rounded-2xl border border-dashed border-[#cfd8d3] bg-[#fafbfa] px-5 py-10 text-center"><span className="grid size-12 place-items-center rounded-full bg-[#edf4f0] text-[#286d52]"><UserPlus size={22} /></span><h3 className="mt-4 font-semibold">Create an invitation link</h3><p className="mt-2 max-w-md text-sm text-[#76827d]">Anyone with the private link can review the terms, sign in, and request to join.</p><button className="mt-5 flex items-center gap-2 rounded-xl bg-[#123f31] px-5 py-3 text-sm font-semibold text-white"><Copy size={16} /> Generate invite link</button></div></div></section>
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#e1e5e2] bg-white px-5 py-4"><Users size={19} className="text-[#2b7659]" /><p className="text-sm text-[#65716c]">You are the circle administrator and occupy payout position 1.</p></div>
  </div></main></AppShell>;
}

function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#e1e5e2] bg-white p-5"><p className="text-sm text-[#78847f]">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>; }
