"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function deleteSelectedCircles(formData: FormData) {
  const requestedIds = formData.getAll("circle_ids").map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 100);
  if (!requestedIds.length) redirect("/circles");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const { data: circles } = await supabase.from("circles").select("id,status,created_by").in("id", requestedIds);
  const allowed = (circles ?? []).filter((circle) => circle.created_by === user.id && ["draft", "forming"].includes(circle.status));
  const formingIds = allowed.filter((circle) => circle.status === "forming").map((circle) => circle.id);
  if (formingIds.length) await supabase.from("circles").update({ status: "draft" }).in("id", formingIds);
  const allowedIds = allowed.map((circle) => circle.id);
  if (allowedIds.length) await supabase.from("circles").delete().in("id", allowedIds);
  revalidatePath("/circles");
  revalidatePath("/dashboard");
  redirect("/circles");
}
