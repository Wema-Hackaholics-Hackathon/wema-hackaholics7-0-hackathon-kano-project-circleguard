"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function generateInvitation(formData: FormData) {
  const circleId = String(formData.get("circle_id") ?? "");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data, error } = await supabase
    .from("invitations")
    .insert({ circle_id: circleId, invited_by: user.id })
    .select("token")
    .single();

  if (error || !data) redirect(`/circles/${circleId}?error=invite_failed`);
  redirect(`/circles/${circleId}?invite=${data.token}`);
}
