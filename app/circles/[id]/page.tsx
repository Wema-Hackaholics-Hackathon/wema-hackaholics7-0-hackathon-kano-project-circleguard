import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ArrowLeft, Copy, Landmark, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/utils/supabase/server";
import { approveMember, generateInvitation, rejectMember } from "./actions";
import { InviteLink } from "@/components/invite-link";
import { RemoveMemberForm } from "@/components/remove-member-form";
import { CycleSimulator } from "@/components/cycle-simulator";

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
  const { data: membershipRows } = isAdmin
    ? await supabase
        .from("circle_members")
        .select("profile_id,role,status,payout_position,joined_at,profiles(full_name)")
        .eq("circle_id", id)
        .in("status", ["active", "invited"])
        .order("joined_at", { ascending: true })
    : { data: null };
  const members = (membershipRows ?? []) as unknown as Array<{ profile_id: string; role: string; status: string; payout_position: number | null; profiles: { full_name: string } | null }>;
  const pendingMembers = members.filter((member) => member.status === "invited");
  const activeMembers = members.filter((member) => member.status === "active");
  const { data: latestCycle } = await supabase.from("circle_cycles").select("id,cycle_number,due_date").eq("circle_id", id).order("cycle_number", { ascending: false }).limit(1).maybeSingle();
  const { data: readinessRows } = latestCycle
    ? await supabase.from("readiness_assessments").select("profile_id,score,readiness,inflow_trend,on_time_rate,profiles(full_name)").eq("cycle_id", latestCycle.id).order("score", { ascending: false })
    : { data: null };
  const readiness = (readinessRows ?? []) as unknown as Array<{ profile_id: string; score: number; readiness: string; inflow_trend: string; on_time_rate: number; profiles: { full_name: string } | null }>;
  const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
  const payout = Number(circle.contribution_amount) * circle.member_limit;

  return <AppShell active="My circles"><main className="p-5 sm:p-7 xl:p-10"><div className="mx-auto max-w-[1050px]">
    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[#66736d]"><ArrowLeft size={16} /> Back to overview</Link>
    <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="rounded-full border border-[#cfe2d8] bg-[#eff7f3] px-3 py-1 text-xs font-semibold capitalize text-[#277255]">{circle.status}</span><h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{circle.name}</h1><p className="mt-2 text-sm text-[#6f7b76]">{circle.frequency} savings circle · Starts {new Date(`${circle.start_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p></div></div>
    <section className="mt-8 grid gap-4 sm:grid-cols-3"><Card label="Contribution" value={money.format(circle.contribution_amount)} /><Card label="Payout per cycle" value={money.format(payout)} /><Card label="Members" value={`${joinedMembers} of ${circle.member_limit}`} /></section>
    <section className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-[#dce5e0] bg-[#f4f8f6] p-5 sm:flex-row sm:items-center"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#2b7659]"><Landmark size={19} /></span><div><h2 className="font-semibold">Open Banking setup</h2><p className="mt-1 text-sm text-[#68766f]">Connect your account and run the sandbox readiness analysis.</p></div></div><Link href={`/circles/${id}/bank`} className="flex items-center justify-center rounded-xl bg-[#123f31] px-5 py-3 text-sm font-semibold text-white">Connect account</Link></section>
    {isAdmin && <section className="mt-5 rounded-2xl border border-[#dce5e0] bg-white p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf4f0] text-[#2b7659]"><Activity size={19} /></span><div><h2 className="font-semibold">Cycle simulator</h2><p className="mt-1 text-sm text-[#68766f]">{latestCycle ? `Cycle ${latestCycle.cycle_number} completed · due ${new Date(`${latestCycle.due_date}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}` : "No cycle simulated yet"}</p></div></div><CycleSimulator circleId={id} /></div></section>}
    {readiness.length > 0 && <section className="mt-5 overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white"><div className="border-b border-[#e7eae8] px-6 py-4"><h2 className="font-semibold">Cycle {latestCycle?.cycle_number} readiness</h2><p className="mt-1 text-sm text-[#78847f]">Latest result for connected demo members</p></div><div className="divide-y divide-[#edf0ee]">{readiness.map((item) => <div key={item.profile_id} className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-semibold">{item.profiles?.full_name || "Demo member"}</p><p className="mt-1 text-xs capitalize text-[#7c8782]">{item.inflow_trend.replaceAll("_", " ")} inflow · {item.on_time_rate}% on time</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${item.readiness === "ready" ? "bg-[#e7f4ed] text-[#267254]" : item.readiness === "action_required" ? "bg-red-50 text-red-700" : "bg-[#fff5df] text-[#94630f]"}`}>{item.readiness.replaceAll("_", " ")}</span><span className="text-sm font-semibold">{item.score}/100</span></div>)}</div></section>}
    {isAdmin && pendingMembers.length > 0 && <section className="mt-5 overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white"><div className="border-b border-[#e7eae8] px-6 py-4"><h2 className="font-semibold">Join requests</h2><p className="mt-1 text-sm text-[#78847f]">Approve people you recognise before they enter the circle.</p></div><div className="divide-y divide-[#edf0ee]">{pendingMembers.map((member) => <div key={member.profile_id} className="flex flex-col justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#edf4f0] font-semibold text-[#2b7659]">{initials(member.profiles?.full_name)}</span><div><p className="font-semibold">{member.profiles?.full_name || "Unnamed member"}</p><p className="mt-1 text-xs text-[#7c8782]">Requested to join</p></div></div><div className="flex gap-2"><form action={rejectMember}><input type="hidden" name="circle_id" value={id} /><input type="hidden" name="profile_id" value={member.profile_id} /><button className="rounded-xl border border-[#dce2de] px-4 py-2 text-sm font-semibold">Reject</button></form><form action={approveMember}><input type="hidden" name="circle_id" value={id} /><input type="hidden" name="profile_id" value={member.profile_id} /><button className="rounded-xl bg-[#123f31] px-4 py-2 text-sm font-semibold text-white">Approve</button></form></div></div>)}</div></section>}
    {isAdmin ? <section className="mt-5 overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white"><div className="border-b border-[#e7eae8] px-6 py-4"><h2 className="font-semibold">Add members</h2><p className="mt-1 text-sm text-[#78847f]">Fill the remaining {Math.max(circle.member_limit - joinedMembers, 0)} spots. Share one reusable link and approve each request.</p></div><div className="p-6">{visibleInviteToken ? <InviteLink token={visibleInviteToken} /> : <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#cfd8d3] bg-[#fafbfa] px-5 py-10 text-center"><span className="grid size-12 place-items-center rounded-full bg-[#edf4f0] text-[#286d52]"><UserPlus size={22} /></span><h3 className="mt-4 font-semibold">Create a reusable invitation link</h3><p className="mt-2 max-w-md text-sm text-[#76827d]">Members can request to join. You approve each request.</p>{query.error && <p className="mt-4 text-sm text-red-600">The action could not be completed. Please try again.</p>}<form action={generateInvitation}><input type="hidden" name="circle_id" value={id} /><button className="mt-5 flex items-center gap-2 rounded-xl bg-[#123f31] px-5 py-3 text-sm font-semibold text-white"><Copy size={16} /> Generate invite link</button></form></div>}</div></section> : <section className="mt-5 rounded-2xl border border-[#e1e5e2] bg-white p-6"><h2 className="font-semibold">Your membership</h2><p className="mt-2 text-sm text-[#6f7b76]">You joined this circle as a member. Only circle administrators can invite or manage members.</p></section>}
    {isAdmin && activeMembers.length > 0 && <section className="mt-5 overflow-hidden rounded-2xl border border-[#e1e5e2] bg-white"><div className="border-b border-[#e7eae8] px-6 py-4"><h2 className="font-semibold">Members</h2><p className="mt-1 text-sm text-[#78847f]">{activeMembers.length} active {activeMembers.length === 1 ? "member" : "members"}</p></div><div className="divide-y divide-[#edf0ee]">{activeMembers.map((member) => { const memberName = member.profiles?.full_name || "Unnamed member"; return <div key={member.profile_id} className="flex items-center justify-between gap-4 px-6 py-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#edf4f0] font-semibold text-[#2b7659]">{initials(memberName)}</span><div><p className="font-semibold">{memberName}</p><p className="mt-1 text-xs capitalize text-[#7c8782]">{member.role}{member.payout_position ? ` · Position ${member.payout_position}` : ""}</p></div></div>{member.role !== "admin" && ["draft", "forming"].includes(circle.status) && <RemoveMemberForm circleId={id} profileId={member.profile_id} memberName={memberName} />}</div>; })}</div></section>}
    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#e1e5e2] bg-white px-5 py-4"><Users size={19} className="text-[#2b7659]" /><p className="text-sm text-[#65716c]">You are {isAdmin ? "the circle administrator" : "a circle member"}{membership?.payout_position ? ` · Payout position ${membership.payout_position}` : ""}.</p></div>
  </div></main></AppShell>;
}

function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[#e1e5e2] bg-white p-5"><p className="text-sm text-[#78847f]">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>; }
function initials(name?: string) { return name ? name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "?"; }
