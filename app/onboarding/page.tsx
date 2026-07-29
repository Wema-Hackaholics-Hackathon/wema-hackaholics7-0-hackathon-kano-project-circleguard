"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function saveName(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const fullName = name.trim();
    if (fullName.length < 2) {
      setLoading(false);
      return setError("Please enter your name.");
    }
    const { error: updateError } = await createClient().auth.updateUser({
      data: { full_name: fullName },
    });
    setLoading(false);
    if (updateError) return setError(updateError.message);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f1e9] px-5 py-12 text-[#10231d]">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_24px_80px_rgba(15,55,44,0.12)]">
        <div className="mb-8 grid size-11 place-items-center rounded-2xl bg-[#0f6b50] font-bold text-white">CG</div>
        <p className="text-sm font-semibold text-[#0f6b50]">One last step</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">What should we call you?</h1>
        <p className="mt-2 text-[#65736e]">This name will appear in your savings circles.</p>
        <form className="mt-8 space-y-5" onSubmit={saveName}>
          <label className="block text-sm font-medium">Full name
            <input className="mt-2 w-full rounded-xl border border-[#d8dfdc] px-4 py-3 outline-none focus:border-[#0f6b50] focus:ring-2 focus:ring-[#0f6b50]/15" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Musa Bello" autoComplete="name" required autoFocus />
          </label>
          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-[#0f6b50] px-4 py-3.5 font-semibold text-white transition hover:bg-[#0b5942] disabled:opacity-60">
            {loading ? "Saving…" : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}
