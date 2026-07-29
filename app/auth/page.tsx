"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendLink(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) return setMessage(error.message);
    setSent(true);
    setMessage("Magic link sent. Open your email and click the link to continue.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f1e9] px-5 py-12 text-[#10231d]">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_24px_80px_rgba(15,55,44,0.12)]">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-[#0f6b50] font-bold text-white">CG</div>
          <div><h1 className="text-xl font-bold">CircleGuard</h1><p className="text-sm text-[#65736e]">Ajo built on verifiable trust</p></div>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight">{sent ? "Check your email" : "Welcome"}</h2>
        <p className="mt-2 text-[#65736e]">{sent ? `We sent a sign-in link to ${email}.` : "Sign in or create your account using your email."}</p>
        <form className="mt-8 space-y-5" onSubmit={sendLink}>
          {!sent && (
            <label className="block text-sm font-medium">Email address
              <input className="mt-2 w-full rounded-xl border border-[#d8dfdc] px-4 py-3 outline-none focus:border-[#0f6b50] focus:ring-2 focus:ring-[#0f6b50]/15" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoFocus />
            </label>
          )}
          {message && <p className="rounded-xl bg-[#eef6f2] px-4 py-3 text-sm text-[#315c4e]" role="status">{message}</p>}
          {!sent && <button disabled={loading} className="w-full rounded-xl bg-[#0f6b50] px-4 py-3.5 font-semibold text-white transition hover:bg-[#0b5942] disabled:opacity-60">
            {loading ? "Sending…" : "Send magic link"}
          </button>}
          {sent && <button type="button" onClick={() => { setSent(false); setMessage(""); }} className="w-full text-sm font-medium text-[#0f6b50]">Use another email</button>}
        </form>
      </section>
    </main>
  );
}
