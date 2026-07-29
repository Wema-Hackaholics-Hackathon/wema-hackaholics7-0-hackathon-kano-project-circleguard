import { analyzeAccountTrend } from "@/lib/open-banking/trend-engine";
import { availableBalanceForCycle, demoBankProfiles, getDemoProfile, transactionsForCycles } from "@/lib/demo-banking/profiles";
import { createClient } from "@/utils/supabase/server";
import { guardProtectedCycles, guardRiskLevel, payoutRecipient } from "@/lib/demo-banking/guard-engine";
import type { TrendResult } from "@/lib/open-banking/types";
import { isGuardOverrideApproved } from "@/lib/demo-banking/override-store";

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
  const body = await request.json() as { action?: string; circleId?: string; profileKey?: string; contributionAmount?: number; demoScenario?: string };
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
      supabase.from("circle_members").select("profile_id,payout_position,profiles(full_name)").eq("circle_id", body.circleId).eq("status", "active"),
      supabase.from("demo_bank_connections").select("user_id,profile_key").eq("circle_id", body.circleId),
    ]);
    if (!activeMembers?.length) return Response.json({ error: "This circle has no active members." }, { status: 400 });
    const members = activeMembers as unknown as Array<{ profile_id: string; payout_position: number | null; profiles: { full_name: string } | null }>;
    const resolvedConnections = resolveDemoConnections(members, connections ?? []);
    const { data: latest } = await supabase.from("circle_cycles").select("cycle_number").eq("circle_id", body.circleId).order("cycle_number", { ascending: false }).limit(1).maybeSingle();
    const cycleNumber = (latest?.cycle_number ?? 0) + 1;
    if (cycleNumber > 8) return Response.json({ error: "All 8 demo cycles have been simulated." }, { status: 400 });
    const dueDate = nextDueDate(circle.start_date, circle.frequency, cycleNumber);
    const beneficiary = payoutRecipient(members, cycleNumber)!;
    const demoScenario = ["green", "amber", "red"].includes(body.demoScenario ?? "") ? body.demoScenario as "green" | "amber" | "red" : "auto";
    const { data: cycle, error: cycleError } = await supabase.from("circle_cycles").insert({ circle_id: body.circleId, cycle_number: cycleNumber, due_date: dueDate, created_by: user.id }).select("id").single();
    if (cycleError || !cycle) return Response.json({ error: "Run the demo simulator SQL patch in Supabase first." }, { status: 500 });
    const trends = new Map<string, ReturnType<typeof analyzeAccountTrend>>();
    for (const connection of resolvedConnections) {
      const profile = getDemoProfile(connection.profile_key);
      if (!profile) continue;
      const coveredByGuard = hasGuardCoverage(body.circleId, connection.user_id, cycleNumber, members, resolvedConnections, Number(circle.contribution_amount));
      const forcedOutcome = demoScenario === "green" ? "on_time" : demoScenario === "amber" ? "late" : demoScenario === "red" ? "failed" : null;
      const outcome = coveredByGuard ? "on_time" : connection.user_id === beneficiary.profile_id && forcedOutcome ? forcedOutcome : profile.outcomes[cycleNumber - 1];
      // Predict this cycle using only information that existed before its due date.
      // The current cycle's simulated outcome must not influence its own prediction.
      const previousTransactions = transactionsForCycles(
        profile,
        Number(circle.contribution_amount),
        cycleNumber - 1,
      );
      const contributionAmount = Number(circle.contribution_amount);
      const analyzedTrend = analyzeAccountTrend(previousTransactions, "active", { contributionAmount, availableBalance: availableBalanceForCycle(profile, contributionAmount, cycleNumber - 1) });
      const trend = connection.user_id === beneficiary.profile_id ? applyDemoScenario(analyzedTrend, demoScenario) : analyzedTrend;
      trends.set(connection.user_id, trend);
      const paidAt = outcome === "failed" ? null : paymentDate(dueDate, outcome);
      await supabase.from("demo_contributions").insert({ cycle_id: cycle.id, circle_id: body.circleId, profile_id: connection.user_id, amount: circle.contribution_amount, outcome, paid_at: paidAt });
      await supabase.from("readiness_assessments").insert({ cycle_id: cycle.id, circle_id: body.circleId, profile_id: connection.user_id, score: trend.score, readiness: trend.readiness, inflow_trend: trend.inflowTrend, on_time_rate: trend.onTimeRate, reasons: sharedRiskReasons(trend) });
    }
    const riskLevel = guardRiskLevel(trends.get(beneficiary.profile_id)?.readiness);
    const protectedCycles = guardProtectedCycles(riskLevel, cycleNumber);
    return Response.json({ cycleNumber, connectedMembers: resolvedConnections.length, riskLevel, protectedCycles });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}

function applyDemoScenario(trend: TrendResult, scenario: "auto" | "green" | "amber" | "red"): TrendResult {
  if (scenario === "auto") return trend;
  if (scenario === "green") return { ...trend, score: 90, readiness: "ready", inflowTrend: "stable", onTimeRate: 100, failedContributions: 0, contributionBurden: 0.12, balanceCoverage: 3 };
  if (scenario === "amber") return { ...trend, score: 65, readiness: "protection_recommended", inflowTrend: "reducing", onTimeRate: 70, failedContributions: 0, contributionBurden: 0.34, balanceCoverage: 0.8 };
  return { ...trend, score: 38, readiness: "action_required", inflowTrend: "reducing", onTimeRate: 40, failedContributions: 2, contributionBurden: 0.58, balanceCoverage: 0.3 };
}

function sharedRiskReasons(trend: TrendResult) {
  const affordability = trend.contributionBurden === null ? "not assessed" : trend.contributionBurden <= 0.2 ? "comfortable" : trend.contributionBurden <= 0.35 ? "moderate" : "high";
  const buffer = trend.balanceCoverage === null ? "not assessed" : trend.balanceCoverage >= 2 ? "strong" : trend.balanceCoverage >= 1 ? "adequate" : "low";
  const reliability = trend.failedContributions > 0 ? "concerning" : trend.onTimeRate >= 80 || trend.completedContributions === 0 ? "good" : "mixed";
  return [
    `Inflow pattern is ${trend.inflowTrend.replaceAll("_", " ")}`,
    `Affordability is ${affordability}`,
    `Cash buffer is ${buffer}`,
    `Payment reliability is ${reliability}`,
  ];
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

function resolveDemoConnections(
  members: Array<{ profile_id: string; payout_position: number | null; profiles: { full_name: string } | null }>,
  savedConnections: Array<{ user_id: string; profile_key: string }>,
) {
  const usedKeys = new Set(savedConnections.map((connection) => connection.profile_key));
  return members.map((member, index) => {
    const saved = savedConnections.find((connection) => connection.user_id === member.profile_id);
    if (saved) return saved;
    const memberName = member.profiles?.full_name?.trim().toLowerCase();
    const nameMatch = demoBankProfiles.find((profile) => !usedKeys.has(profile.key) && profile.name.toLowerCase() === memberName);
    const availableProfile = nameMatch ?? demoBankProfiles.find((profile) => !usedKeys.has(profile.key)) ?? demoBankProfiles[index % demoBankProfiles.length];
    usedKeys.add(availableProfile.key);
    return { user_id: member.profile_id, profile_key: availableProfile.key };
  });
}

function hasGuardCoverage(
  circleId: string,
  profileId: string,
  cycleNumber: number,
  members: Array<{ profile_id: string; payout_position: number | null }>,
  connections: Array<{ user_id: string; profile_key: string }>,
  contributionAmount: number,
) {
  for (let sourceCycle = Math.max(1, cycleNumber - 2); sourceCycle < cycleNumber; sourceCycle += 1) {
    if (isGuardOverrideApproved(circleId, sourceCycle)) continue;
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
