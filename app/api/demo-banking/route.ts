import { analyzeAccountTrend } from "@/lib/open-banking/trend-engine";
import { availableBalanceForCycle, demoBankProfiles, getDemoProfile, transactionsForCycles } from "@/lib/demo-banking/profiles";
import { createClient } from "@/utils/supabase/server";
import { guardProtectedCycles, guardRiskLevel, payoutRecipient } from "@/lib/demo-banking/guard-engine";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const circleId = new URL(request.url).searchParams.get("circleId");
  let { data: connection } = circleId
    ? await supabase.from("demo_bank_connections").select("profile_key").eq("circle_id", circleId).eq("user_id", user.id).maybeSingle()
    : { data: null };
  const globalProfileKey = user.user_metadata.demo_bank_profile_key as string | undefined;
  if (circleId && !connection && globalProfileKey) {
    const { data } = await supabase.from("demo_bank_connections").upsert({ circle_id: circleId, user_id: user.id, profile_key: globalProfileKey }, { onConflict: "circle_id,user_id" }).select("profile_key").maybeSingle();
    connection = data;
  }
  return Response.json({ profiles: demoBankProfiles.map((profile) => ({
    key: profile.key,
    name: profile.name,
    bankName: profile.bankName,
    accountNumber: profile.accountNumber,
    occupation: profile.occupation,
    openingBalance: profile.openingBalance,
  })), connectedProfileKey: connection?.profile_key ?? globalProfileKey ?? null });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { action?: string; circleId?: string; profileKey?: string; contributionAmount?: number };
  if (body.action === "connect") {
    const profile = getDemoProfile(body.profileKey ?? "");
    if (!profile) return Response.json({ error: "Choose a demo account" }, { status: 400 });
    const { error: metadataError } = await supabase.auth.updateUser({ data: { demo_bank_profile_key: profile.key } });
    if (metadataError) return Response.json({ error: "Could not save the bank connection." }, { status: 500 });
    if (body.circleId) {
      const { error } = await supabase.from("demo_bank_connections").upsert({ circle_id: body.circleId, user_id: user.id, profile_key: profile.key }, { onConflict: "circle_id,user_id" });
      if (error) return Response.json({ error: "Run the demo simulator SQL patch in Supabase first." }, { status: 500 });
    }
    return Response.json({ connected: true });
  }

  if (body.action === "disconnect") {
    await supabase.auth.updateUser({ data: { demo_bank_profile_key: null } });
    let deletion = supabase.from("demo_bank_connections").delete().eq("user_id", user.id);
    if (body.circleId) deletion = deletion.eq("circle_id", body.circleId);
    const { error } = await deletion;
    if (error) return Response.json({ error: "Could not disconnect this account. Run the updated simulator SQL patch first." }, { status: 500 });
    return Response.json({ disconnected: true });
  }

  if (body.action === "analyze") {
    const { data: connection } = body.circleId
      ? await supabase.from("demo_bank_connections").select("profile_key").eq("circle_id", body.circleId).eq("user_id", user.id).maybeSingle()
      : { data: null };
    const profile = getDemoProfile(connection?.profile_key ?? user.user_metadata.demo_bank_profile_key ?? "");
    if (!profile) return Response.json({ error: "Connect a demo account first." }, { status: 400 });
    const { count } = body.circleId
      ? await supabase.from("circle_cycles").select("id", { count: "exact", head: true }).eq("circle_id", body.circleId)
      : { count: 0 };
    const transactions = transactionsForCycles(profile, Number(body.contributionAmount) || 0, Math.max(count ?? 0, 1));
    const contributionAmount = Number(body.contributionAmount) || 0;
    const availableBalance = availableBalanceForCycle(profile, contributionAmount, Math.max(count ?? 0, 1));
    return Response.json({ profile: publicProfile(profile, availableBalance), trend: analyzeAccountTrend(transactions, "active", { contributionAmount, availableBalance }) });
  }

  if (body.action === "simulate") {
    if (!body.circleId) return Response.json({ error: "Circle is required" }, { status: 400 });
    const { data: membership } = await supabase.from("circle_members").select("role").eq("circle_id", body.circleId).eq("profile_id", user.id).eq("status", "active").maybeSingle();
    if (membership?.role !== "admin") return Response.json({ error: "Only the circle administrator can simulate a cycle." }, { status: 403 });
    const { data: circle } = await supabase.from("circles").select("contribution_amount,frequency,start_date,status").eq("id", body.circleId).single();
    if (!circle) return Response.json({ error: "Circle not found" }, { status: 404 });
    if (circle.status !== "active") return Response.json({ error: "The circle must be full and active before cycles can be simulated." }, { status: 400 });
    const [{ data: activeMembers }, { data: connections }] = await Promise.all([
      supabase.from("circle_members").select("profile_id,payout_position").eq("circle_id", body.circleId).eq("status", "active"),
      supabase.from("demo_bank_connections").select("user_id,profile_key").eq("circle_id", body.circleId),
    ]);
    if (!activeMembers?.length || (connections?.length ?? 0) !== activeMembers.length) {
      return Response.json({ error: "Every member must open this circle once so their connected demo account can be linked before simulation." }, { status: 400 });
    }
    const { data: latest } = await supabase.from("circle_cycles").select("cycle_number").eq("circle_id", body.circleId).order("cycle_number", { ascending: false }).limit(1).maybeSingle();
    const cycleNumber = (latest?.cycle_number ?? 0) + 1;
    if (cycleNumber > 8) return Response.json({ error: "All 8 demo cycles have been simulated." }, { status: 400 });
    const dueDate = nextDueDate(circle.start_date, circle.frequency, cycleNumber);
    const { data: cycle, error: cycleError } = await supabase.from("circle_cycles").insert({ circle_id: body.circleId, cycle_number: cycleNumber, due_date: dueDate, created_by: user.id }).select("id").single();
    if (cycleError || !cycle) return Response.json({ error: "Run the demo simulator SQL patch in Supabase first." }, { status: 500 });
    const trends = new Map<string, ReturnType<typeof analyzeAccountTrend>>();
    for (const connection of connections ?? []) {
      const profile = getDemoProfile(connection.profile_key);
      if (!profile) continue;
      const coveredByGuard = hasGuardCoverage(connection.user_id, cycleNumber, activeMembers, connections ?? [], Number(circle.contribution_amount));
      const outcome = coveredByGuard ? "on_time" : profile.outcomes[cycleNumber - 1];
      // Predict this cycle using only information that existed before its due date.
      // The current cycle's simulated outcome must not influence its own prediction.
      const previousTransactions = transactionsForCycles(
        profile,
        Number(circle.contribution_amount),
        cycleNumber - 1,
      );
      const contributionAmount = Number(circle.contribution_amount);
      const trend = analyzeAccountTrend(previousTransactions, "active", { contributionAmount, availableBalance: availableBalanceForCycle(profile, contributionAmount, cycleNumber - 1) });
      trends.set(connection.user_id, trend);
      const paidAt = outcome === "failed" ? null : paymentDate(dueDate, outcome);
      await supabase.from("demo_contributions").insert({ cycle_id: cycle.id, circle_id: body.circleId, profile_id: connection.user_id, amount: circle.contribution_amount, outcome, paid_at: paidAt });
      await supabase.from("readiness_assessments").insert({ cycle_id: cycle.id, circle_id: body.circleId, profile_id: connection.user_id, score: trend.score, readiness: trend.readiness, inflow_trend: trend.inflowTrend, on_time_rate: trend.onTimeRate, reasons: trend.reasons });
    }
    const beneficiary = payoutRecipient(activeMembers, cycleNumber)!;
    const riskLevel = guardRiskLevel(trends.get(beneficiary.profile_id)?.readiness);
    const protectedCycles = guardProtectedCycles(riskLevel, cycleNumber);
    return Response.json({ cycleNumber, connectedMembers: connections?.length ?? 0, riskLevel, protectedCycles });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}

function publicProfile(profile: ReturnType<typeof getDemoProfile> & {}, availableBalance = profile?.openingBalance ?? 0) {
  if (!profile) return null;
  return { key: profile.key, name: profile.name, bankName: profile.bankName, occupation: profile.occupation, maskedNumber: `•••• ${profile.accountNumber.slice(-4)}`, availableBalance };
}

function nextDueDate(startDate: string, frequency: string, cycleNumber: number) {
  const date = new Date(`${startDate}T12:00:00Z`);
  if (frequency === "weekly") date.setUTCDate(date.getUTCDate() + (cycleNumber - 1) * 7);
  else date.setUTCMonth(date.getUTCMonth() + cycleNumber - 1);
  return date.toISOString().slice(0, 10);
}

function paymentDate(dueDate: string, outcome: string) {
  const date = new Date(`${dueDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (outcome === "early" ? -2 : outcome === "late" ? 3 : 0));
  return date.toISOString();
}

function hasGuardCoverage(
  profileId: string,
  cycleNumber: number,
  members: Array<{ profile_id: string; payout_position: number | null }>,
  connections: Array<{ user_id: string; profile_key: string }>,
  contributionAmount: number,
) {
  for (let sourceCycle = Math.max(1, cycleNumber - 2); sourceCycle < cycleNumber; sourceCycle += 1) {
    const beneficiary = payoutRecipient(members, sourceCycle);
    if (!beneficiary || beneficiary.profile_id !== profileId) continue;
    const connection = connections.find((item) => item.user_id === profileId);
    const profile = getDemoProfile(connection?.profile_key ?? "");
    if (!profile) continue;
    const trend = analyzeAccountTrend(transactionsForCycles(profile, contributionAmount, sourceCycle - 1), "active", { contributionAmount, availableBalance: availableBalanceForCycle(profile, contributionAmount, sourceCycle - 1) });
    const protectedCycles = guardProtectedCycles(guardRiskLevel(trend.readiness), sourceCycle);
    if (cycleNumber <= sourceCycle + protectedCycles) return true;
  }
  return false;
}
