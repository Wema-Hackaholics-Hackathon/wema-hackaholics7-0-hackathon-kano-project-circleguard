import Link from "next/link";
import { CircleDollarSign, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/utils/supabase/server";
import { CircleList } from "@/components/circle-list";

type Circle = {
  id: string;
  name: string;
  contribution_amount: number;
  frequency: "weekly" | "monthly";
  member_limit: number;
  start_date: string;
  status: string;
  created_by: string;
};

export default async function CirclesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("circles")
    .select("id,name,contribution_amount,frequency,member_limit,start_date,status,created_by")
    .order("created_at", { ascending: false });
  const circles = (data ?? []) as Circle[];

  return (
    <AppShell active="My circles">
      <main className="p-5 sm:p-7 xl:p-10">
        <div className="mx-auto max-w-[1080px]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-sm font-semibold text-[#2b7659]">SAVINGS CIRCLES</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">My circles</h1><p className="mt-2 text-sm text-[#6f7b76]">Manage the circles you created or joined.</p></div>
            <Link href="/circles/new" className="flex items-center justify-center gap-2 rounded-xl bg-[#123f31] px-4 py-3 text-sm font-semibold text-white"><Plus size={17} /> Create a circle</Link>
          </div>

          {circles.length === 0 ? (
            <section className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-[#ccd6d1] bg-white px-5 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-[#edf4f0] text-[#2b7659]"><CircleDollarSign size={25} /></span>
              <h2 className="mt-5 text-xl font-semibold">No circles yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[#74807b]">Create your first ajo or accept a private invitation from another administrator.</p>
              <Link href="/circles/new" className="mt-6 flex items-center gap-2 rounded-xl bg-[#123f31] px-5 py-3 text-sm font-semibold text-white"><Plus size={16} /> Create your first circle</Link>
            </section>
          ) : (
            <CircleList circles={circles.map((circle) => ({ ...circle, canDelete: circle.created_by === user?.id && ["draft", "forming"].includes(circle.status) }))} />
          )}
        </div>
      </main>
    </AppShell>
  );
}
