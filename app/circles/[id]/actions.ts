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

export async function removeMember(formData: FormData) {
  const circleId = String(formData.get("circle_id") ?? "");
  const profileId = String(formData.get("profile_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_circle_member", {
    p_circle_id: circleId,
    p_profile_id: profileId,
  });
  if (error) redirect(`/circles/${circleId}?error=remove_failed`);
  revalidatePath(`/circles/${circleId}`);
  revalidatePath("/circles");
  revalidatePath("/dashboard");
}

export async function deleteCircle(formData: FormData) {
  const circleId = String(formData.get("circle_id") ?? "");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const { data: circle } = await supabase.from("circles").select("created_by,status").eq("id", circleId).maybeSingle();
  if (!circle || circle.created_by !== user.id || !["draft", "forming"].includes(circle.status)) redirect(`/circles/${circleId}?error=delete_not_allowed`);
  if (circle.status === "forming") {
    const { error: statusError } = await supabase.from("circles").update({ status: "draft" }).eq("id", circleId);
    if (statusError) redirect(`/circles/${circleId}?error=delete_failed`);
  }
  const { data: deleted, error } = await supabase.from("circles").delete().eq("id", circleId).select("id").maybeSingle();
  if (error || !deleted) redirect(`/circles/${circleId}?error=delete_failed`);
  revalidatePath("/circles");
  revalidatePath("/dashboard");
  redirect("/circles");
}
