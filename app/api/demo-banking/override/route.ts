import { createClient } from "@/utils/supabase/server";
import { guardRiskLevel, payoutRecipient } from "@/lib/demo-banking/guard-engine";
import { getGuardOverride, requestGuardOverride, voteOnGuardOverride } from "@/lib/demo-banking/override-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return handle(request, url.searchParams.get("circleId") ?? "", Number(url.searchParams.get("cycleNumber")), "read");
}

export async function POST(request: Request) {
  const body = await request.json() as { circleId?: string; cycleNumber?: number; action?: "request" | "vote"; reason?: string; vote?: "approve" | "reject" };
  return handle(request, body.circleId ?? "", Number(body.cycleNumber), body.action ?? "read", body);
}

async function handle(_request: Request, circleId: string, cycleNumber: number, action: "read" | "request" | "vote", body?: { reason?: string; vote?: "approve" | "reject" }) {
  if (!circleId || !Number.isInteger(cycleNumber) || cycleNumber < 1) return Response.json({ error: "Invalid override request." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [{ data: membership }, { data: members }, { data: cycle }] = await Promise.all([
    supabase.from("circle_members").select("role").eq("circle_id", circleId).eq("profile_id", user.id).eq("status", "active").maybeSingle(),
    supabase.from("circle_members").select("profile_id,payout_position").eq("circle_id", circleId).eq("status", "active"),
    supabase.from("circle_cycles").select("id").eq("circle_id", circleId).eq("cycle_number", cycleNumber).maybeSingle(),
  ]);
  if (!membership || !members?.length || !cycle) return Response.json({ error: "Circle access denied." }, { status: 403 });
  const beneficiary = payoutRecipient(members, cycleNumber)!;
  const { data: assessment } = await supabase.from("readiness_assessments").select("readiness").eq("cycle_id", cycle.id).eq("profile_id", beneficiary.profile_id).maybeSingle();
  if (guardRiskLevel(assessment?.readiness) === "green") return Response.json({ error: "Green payouts do not require an override." }, { status: 400 });

  let override = getGuardOverride(circleId, cycleNumber);
  if (action === "request") {
    if (user.id !== beneficiary.profile_id) return Response.json({ error: "Only the scheduled payout recipient can request full release." }, { status: 403 });
    const reason = String(body?.reason ?? "").trim().slice(0, 200);
    if (reason.length < 5) return Response.json({ error: "Add a short reason for the group." }, { status: 400 });
    override = requestGuardOverride(circleId, cycleNumber, beneficiary.profile_id, reason);
  } else if (action === "vote") {
    if (!override) return Response.json({ error: "No full-release request exists." }, { status: 404 });
    if (user.id === beneficiary.profile_id) return Response.json({ error: "The recipient cannot vote on their own request." }, { status: 403 });
    if (!body?.vote || !["approve", "reject"].includes(body.vote)) return Response.json({ error: "Choose a vote." }, { status: 400 });
    override = voteOnGuardOverride(circleId, cycleNumber, user.id, body.vote, members.length - 1);
  }
  const approvals = Object.values(override?.votes ?? {}).filter((vote) => vote === "approve").length;
  const rejections = Object.values(override?.votes ?? {}).filter((vote) => vote === "reject").length;
  return Response.json({ viewerIsBeneficiary: user.id === beneficiary.profile_id, override: override ? { ...override, votes: undefined, approvals, rejections, requiredApprovals: Math.max(1, Math.floor((members.length - 1) / 2) + 1), currentUserVote: override.votes[user.id] ?? null, isBeneficiary: user.id === beneficiary.profile_id } : null });
}
