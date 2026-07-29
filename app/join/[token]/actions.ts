"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function acceptInvitation(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth?next=/join/${token}`);
  if (!user.user_metadata.demo_bank_profile_key) redirect(`/bank?next=/join/${token}`);

  const { data: invitation, error: invitationError } = await supabase.rpc(
    "get_invitation_by_token",
    { p_token: token },
  );
  const invitationRecord = Array.isArray(invitation) ? invitation[0] : invitation;
  const circleId = invitationRecord?.circle_id as string | undefined;
  if (invitationError || !circleId) redirect(`/join/${token}?error=invalid_invite`);

  const { error } = await supabase.rpc("accept_circle_invitation", { p_token: token });
  if (error) redirect(`/join/${token}?error=accept_failed`);
  redirect(`/join/${token}?requested=1`);
}
