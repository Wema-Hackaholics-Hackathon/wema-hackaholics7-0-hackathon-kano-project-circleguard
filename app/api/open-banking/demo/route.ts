import { OpenBankingNigeriaSandboxAdapter } from "@/lib/open-banking/sandbox-adapter";
import { analyzeAccountTrend } from "@/lib/open-banking/trend-engine";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { action?: string; contributionAmount?: number };
  const name = user.user_metadata.full_name || "Circle member";

  const openBanking = new OpenBankingNigeriaSandboxAdapter();

  try {
    if (body.action === "consent") {
      const consent = await openBanking.requestConsent(user.id);
      return Response.json({ consent });
    }
    if (body.action === "analyze") {
      const [account] = await openBanking.getAccounts(user.id, name);
      if (!account) return Response.json({ error: "The sandbox returned no accounts." }, { status: 502 });
      const transactions = await openBanking.getTransactions(account.id, Number(body.contributionAmount) || 0);
      const mandate = await openBanking.getMandateStatus(user.id);
      const trend = analyzeAccountTrend(transactions, mandate);
      return Response.json({ account, trend });
    }
  } catch (error) {
    console.error("Open Banking API request failed", error);
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.message.includes("timeout"));
    return Response.json({
      error: timedOut
        ? "The public sandbox took too long to respond. Please try again."
        : "The Open Banking sandbox is temporarily unavailable. Please try again.",
    }, { status: 502 });
  }
  return Response.json({ error: "Unknown action" }, { status: 400 });
}

