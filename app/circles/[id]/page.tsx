import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/utils/supabase/server";
import { generateInvitation } from "./actions";
import { InviteLink } from "@/components/invite-link";

export default async function CirclePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ invite?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: circle } = await supabase.from("circles").select("*").eq("id", id).single();
  if (!circle) notFound();
  const { data: membership } = await supabase
    .from("circle_members")
    .select("role,payout_position")
    .eq("circle_id", id)
    .eq("profile_id", user!.id)
    .eq("status", "active")
    .single();
  const isAdmin = membership?.role === "admin";
  const { data: pendingInvite } = isAdmin
    ? await supabase
        .from("invitations")
        .select("token")
        .eq("circle_id", id)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };
  const visibleInviteToken = query.invite ?? pendingInvite?.token;
  const { count: memberCount } = await supabase
    .from("circle_members")
    .select("id", { count: "exact", head: true })
    .eq("circle_id", id)
    .eq("status", "active");
  const joinedMembers = memberCount ?? 0;
  const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
  const payout = Number(circle.contribution_amount) * circle.member_limit;

  return <AppShell active="My circles"><main className="p-5 sm:p-7 xl:p-10"><div className="mx-auto max-w-[1050px]">
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[#66736d]"><ArrowLeft size={16} /> Back to overview</Link>
    <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="rounded-full border border-[#cfe2d8] bg-[#eff7f3] px-3 py-1 text-xs font-semibold capitalize text-[#277255]">{circle.status}</span><h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{circle.name}</h1><p className="mt-2 text-sm text-[#6f7b76]">{circle.frequency} savings circle · Starts {new Date(`${circle.start_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p></div></div>
    <section className="mt-8 grid gap-4 sm:grid-cols-3"><Card label="Contribution" value={money.format(circle.contribution_amount)} /><Card label="Payout per cycle" value={money.format(payout)} /><Card label="Members" value={`${joinedMembers} of ${circle.member_limit}`} /></section>
    {isAdmin ? <section className="mt-5 overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white"><div className="border-b border-[#e7eae8] px-6 py-4"><h2 className="font-semibold">Invite your members</h2><p className="mt-1 text-sm text-[#78847f]">Fill the remaining {Math.max(circle.member_limit - joinedMembers, 0)} spots to start this circle. Each link admits one member.</p></div><div className="p-6">{visibleInviteToken ? <InviteLink token={visibleInviteToken} /> : <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#cfd8d3] bg-[#fafbfa] px-5 py-10 text-center"><span className="grid size-12 place-items-center rounded-full bg-[#edf4f0] text-[#286d52]"><UserPlus size={22} /></span><h3 className="mt-4 font-semibold">Create an invitation link</h3><p className="mt-2 max-w-md text-sm text-[#76827d]">The private link expires in seven days and can be accepted once.</p>{query.error && <p className="mt-4 text-sm text-red-600">Could not create the link. Please try again.</p>}<form action={generateInvitation}><input type="hidden" name="circle_id" value={id} /><button className="mt-5 flex items-center gap-2 rounded-xl bg-[#123f31] px-5 py-3 text-sm font-semibold text-white"><Copy size={16} /> Generate invite link</button></form></div>}</div></section> : <section className="mt-5 rounded-2xl border border-[#e1e5e2] bg-white p-6"><h2 className="font-semibold">Your membership</h2><p className="mt-2 text-sm text-[#6f7b76]">You joined this circle as a member. Only circle administrators can invite or manage members.</p></section>}
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#e1e5e2] bg-white px-5 py-4"><Users size={19} className="text-[#2b7659]" /><p className="text-sm text-[#65716c]">You are {isAdmin ? "the circle administrator" : "a circle member"}{membership?.payout_position ? ` · Payout position ${membership.payout_position}` : ""}.</p></div>
  </div></main></AppShell>;
}

function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#e1e5e2] bg-white p-5"><p className="text-sm text-[#78847f]">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>; }
