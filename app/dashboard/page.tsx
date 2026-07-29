import { createClient } from "@/utils/supabase/server";
import { signOut } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <main className="min-h-screen bg-[#f4f1e9] px-5 py-10 text-[#10231d]">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <div><p className="font-bold text-[#0f6b50]">CircleGuard</p><h1 className="mt-2 text-3xl font-semibold">Your circles</h1></div>
          <form action={signOut}><button className="rounded-xl border border-[#cdd8d3] bg-white px-4 py-2 text-sm font-semibold">Sign out</button></form>
        </header>
        <section className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm text-[#65736e]">Signed in as</p>
          <p className="mt-1 font-semibold">{user?.email}</p>
          <h2 className="mt-8 text-2xl font-semibold">Authentication is working.</h2>
          <p className="mt-2 text-[#65736e]">Next we’ll add circle invitations and the Progress Circle dashboard.</p>
        </section>
      </div>
    </main>
  );
}
