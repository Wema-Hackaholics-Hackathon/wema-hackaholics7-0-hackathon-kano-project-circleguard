"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

export async function approveMember(formData: FormData) {
  const circleId = String(formData.get("circle_id") ?? "");
  const profileId = String(formData.get("profile_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_circle_member", {
    p_circle_id: circleId,
    p_profile_id: profileId,
  });
  if (error) redirect(`/circles/${circleId}?error=approve_failed`);
  revalidatePath(`/circles/${circleId}`);
}

export async function rejectMember(formData: FormData) {
  const circleId = String(formData.get("circle_id") ?? "");
  const profileId = String(formData.get("profile_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_circle_member", {
    p_circle_id: circleId,
    p_profile_id: profileId,
  });
  if (error) redirect(`/circles/${circleId}?error=reject_failed`);
  revalidatePath(`/circles/${circleId}`);
}
