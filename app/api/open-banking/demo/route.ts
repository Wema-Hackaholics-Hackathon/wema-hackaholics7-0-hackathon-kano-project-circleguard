import { openBanking } from "@/lib/open-banking";
import { analyzeAccountTrend } from "@/lib/open-banking/trend-engine";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { action?: string; contributionAmount?: number };
  const name = user.user_metadata.full_name || "Circle member";

  if (body.action === "consent") {
    const consent = await openBanking.requestConsent(user.id);
    return Response.json({ consent });
  }
  if (body.action === "analyze") {
    const [account] = await openBanking.getAccounts(user.id, name);
    const transactions = await openBanking.getTransactions(account.id, Number(body.contributionAmount) || 0);
    const mandate = await openBanking.getMandateStatus(user.id);
    const trend = analyzeAccountTrend(transactions, mandate);
    return Response.json({ account, trend });
  }
  return Response.json({ error: "Unknown action" }, { status: 400 });
}
