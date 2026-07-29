"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function createCircle(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const name = String(formData.get("name") ?? "").trim();
  const contributionAmount = Number(formData.get("contribution_amount"));
  const frequency = String(formData.get("frequency") ?? "");
  const memberLimit = Number(formData.get("member_limit"));
  const startDate = String(formData.get("start_date") ?? "");
  const payoutOrderMethod = String(formData.get("payout_order_method") ?? "");

  if (
    name.length < 2 ||
    !Number.isFinite(contributionAmount) || contributionAmount <= 0 ||
    !["weekly", "monthly"].includes(frequency) ||
    !Number.isInteger(memberLimit) || memberLimit < 2 || memberLimit > 100 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !["fixed", "decide_later"].includes(payoutOrderMethod)
  ) {
    redirect("/circles/new?error=invalid");
  }

  const { data, error } = await supabase
    .from("circles")
    .insert({
      name,
      contribution_amount: contributionAmount,
      frequency,
      member_limit: memberLimit,
      start_date: startDate,
      payout_order_method: payoutOrderMethod,
      status: "forming",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Circle creation failed", error?.message);
    redirect("/circles/new?error=create_failed");
  }

  redirect(`/circles/${data.id}`);
}
