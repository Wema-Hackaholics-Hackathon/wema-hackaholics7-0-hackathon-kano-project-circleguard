"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Info, Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { createCircle } from "./actions";

export default function NewCirclePage() {
  const [amount, setAmount] = useState("50000");
  const [members, setMembers] = useState("10");
  const payout = useMemo(() => (Number(amount) || 0) * (Number(members) || 0), [amount, members]);
  const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

  return (
    <AppShell active="My circles">
      <main className="p-5 sm:p-7 xl:p-10">
        <div className="mx-auto max-w-[1040px]">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[#66736d]"><ArrowLeft size={16} /> Back to overview</Link>
          <div className="mt-6"><p className="text-sm font-semibold text-[#2b7659]">NEW SAVINGS CIRCLE</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Create your circle</h1><p className="mt-2 text-sm text-[#6f7b76]">Set the contribution rules. You can invite members after creating it.</p></div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.45fr_.8fr] lg:items-start">
            <form action={createCircle} className="overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white">
              <div className="border-b border-[#e7eae8] px-5 py-4 sm:px-7"><h2 className="font-semibold">Circle details</h2><p className="mt-1 text-sm text-[#7c8782]">Tell us how this ajo will work.</p></div>
              <div className="space-y-6 p-5 sm:p-7">
                <Field label="Circle name" hint="Choose a name members will recognise"><input name="name" className="input" placeholder="e.g. Progress Circle" defaultValue="Progress Circle" minLength={2} required /></Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Contribution amount"><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-[#53615b]">₦</span><input name="contribution_amount" className="input pl-9" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} required /></div></Field>
                  <Field label="Contribution frequency"><select name="frequency" className="input" defaultValue="monthly"><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Number of members"><div className="relative"><Users size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7d8984]" /><input name="member_limit" className="input pl-11" inputMode="numeric" min="2" max="100" value={members} onChange={(event) => setMembers(event.target.value.replace(/\D/g, ""))} required /></div></Field>
                  <Field label="Start date"><div className="relative"><CalendarDays size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7d8984]" /><input name="start_date" className="input pl-11" type="date" defaultValue="2026-08-04" required /></div></Field>
                </div>
                <Field label="Payout order"><div className="grid gap-3 sm:grid-cols-2"><Choice title="Decide later" copy="Set positions after members join" value="decide_later" selected /><Choice title="Fixed order" copy="Choose positions during invites" value="fixed" /></div></Field>
              </div>
              <div className="flex justify-end border-t border-[#e7eae8] bg-[#fafbfa] px-5 py-4 sm:px-7"><button type="submit" className="flex items-center gap-2 rounded-xl bg-[#123f31] px-5 py-3 text-sm font-semibold text-white">Create circle <ArrowRight size={16} /></button></div>
            </form>

            <aside className="overflow-hidden rounded-2xl border border-[#dce3df] bg-white lg:sticky lg:top-8">
              <div className="border-b border-[#e7eae8] px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#89948f]">Circle summary</p><h2 className="mt-2 text-lg font-semibold">Progress Circle</h2></div>
              <div className="space-y-4 p-5 text-sm"><Summary label="Each member pays" value={money.format(Number(amount) || 0)} /><Summary label="Members" value={members || "0"} /><Summary label="Frequency" value="Monthly" /><Summary label="Payout each cycle" value={money.format(payout)} strong /><Summary label="Estimated duration" value={`${members || "0"} months`} /></div>
              <div className="m-4 mt-0 rounded-xl border border-[#dce8e2] bg-[#f2f7f4] p-4 text-xs leading-5 text-[#50625a]"><div className="flex gap-2"><Info size={16} className="mt-0.5 shrink-0 text-[#2b7659]" /><p>CircleGuard will generate a private invitation link after this circle is created.</p></div></div>
            </aside>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <label className="block"><span className="text-sm font-semibold">{label}</span>{hint && <span className="ml-2 text-xs font-normal text-[#929c97]">{hint}</span>}<div className="mt-2">{children}</div></label>; }
function Choice({ title, copy, value, selected }: { title: string; copy: string; value: string; selected?: boolean }) { return <label className={`relative cursor-pointer rounded-xl border p-4 ${selected ? "border-[#2b7659] bg-[#f4f8f6]" : "border-[#e0e5e2]"}`}><input className="sr-only" type="radio" name="payout_order_method" value={value} defaultChecked={selected} /><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-[#7c8782]">{copy}</p>{selected && <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-[#2b7659] text-white"><Check size={12} /></span>}</label>; }
function Summary({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className="flex items-center justify-between gap-4 border-b border-[#edf0ee] pb-4 last:border-0 last:pb-0"><span className="text-[#78847f]">{label}</span><span className={strong ? "text-base font-bold text-[#123f31]" : "font-semibold"}>{value}</span></div>; }
