"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, CircleDollarSign, LoaderCircle, Trash2, Users } from "lucide-react";
import { useFormStatus } from "react-dom";
import { deleteSelectedCircles } from "@/app/circles/actions";

export type CircleListItem = { id: string; name: string; contribution_amount: number; frequency: "weekly" | "monthly"; member_limit: number; start_date: string; status: string; canDelete: boolean };

export function CircleList({ circles }: { circles: CircleListItem[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const deletableCount = circles.filter((circle) => circle.canDelete).length;
  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  return <form action={deleteSelectedCircles} className="mt-8">
    {deletableCount > 0 && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e1e5e2] bg-white px-4 py-3"><label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#5f6d66]"><input type="checkbox" checked={selected.length === deletableCount} onChange={(event) => setSelected(event.target.checked ? circles.filter((circle) => circle.canDelete).map((circle) => circle.id) : [])} className="size-4 accent-[#123f31]" /> Select all draft/forming circles</label><BulkDeleteButton count={selected.length} /></div>}
    {selected.map((id) => <input key={id} type="hidden" name="circle_ids" value={id} />)}
    <section className="grid gap-5 lg:grid-cols-2">{circles.map((circle) => { const payout = Number(circle.contribution_amount) * circle.member_limit; return <article key={circle.id} className={`relative overflow-hidden rounded-2xl border bg-white ${selected.includes(circle.id) ? "border-[#2b7659] ring-1 ring-[#2b7659]" : "border-[#e1e5e2]"}`}>
      {circle.canDelete && <label className="absolute right-12 top-5 z-10 grid size-7 cursor-pointer place-items-center rounded-lg border border-[#d9dfdc] bg-white shadow-sm"><input type="checkbox" checked={selected.includes(circle.id)} onChange={() => toggle(circle.id)} className="size-4 accent-[#123f31]" aria-label={`Select ${circle.name} for deletion`} /></label>}
      <Link href={`/circles/${circle.id}`} className="group block hover:shadow-[0_12px_35px_rgba(20,48,37,0.07)]"><div className="flex items-start justify-between border-b border-[#e9ecea] p-5"><div><span className="rounded-full border border-[#d5e5dd] bg-[#f1f7f4] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#2a7156]">{circle.status}</span><h2 className="mt-3 text-xl font-semibold">{circle.name}</h2><p className="mt-1 text-sm capitalize text-[#78847f]">{circle.frequency} contributions</p></div><ArrowRight size={19} className="mt-1 text-[#9ba59f] transition group-hover:translate-x-1 group-hover:text-[#2b7659]" /></div><div className="grid grid-cols-2 gap-4 p-5 text-sm"><Info icon={<CircleDollarSign size={16} />} label="Contribution" value={money(circle.contribution_amount)} /><Info icon={<Users size={16} />} label="Members" value={`Up to ${circle.member_limit}`} /><Info icon={<CalendarDays size={16} />} label="Starts" value={new Date(`${circle.start_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} /><Info icon={<CircleDollarSign size={16} />} label="Cycle payout" value={money(payout)} /></div></Link>
    </article>; })}</section>
  </form>;
}

function BulkDeleteButton({ count }: { count: number }) { const { pending } = useFormStatus(); return <button type="submit" disabled={!count || pending} className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">{pending ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}{pending ? "Deleting…" : `Delete selected${count ? ` (${count})` : ""}`}</button>; }
function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div><p className="flex items-center gap-2 text-xs text-[#89948f]">{icon}{label}</p><p className="mt-1.5 font-semibold">{value}</p></div>; }
function money(value: number) { return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value); }
