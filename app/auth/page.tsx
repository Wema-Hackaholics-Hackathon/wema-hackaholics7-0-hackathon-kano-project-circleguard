"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) return setMessage(error.message);
      if (!data.session) return setMessage("Email confirmation is still enabled in Supabase.");
      router.replace("/onboarding");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMessage(error.message);
    router.replace("/dashboard");
    router.refresh();
  }

  function switchMode(nextMode: "signin" | "signup") {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f5f3] px-5 py-12 text-[#17211d]">
      <section className="w-full max-w-md rounded-3xl border border-[#e1e5e2] bg-white p-8 shadow-[0_24px_80px_rgba(15,55,44,0.09)]">
        <div className="mb-8 flex items-center gap-3"><div className="grid size-11 place-items-center rounded-full bg-[#123f31] font-bold text-white">CG</div><div><h1 className="text-xl font-bold">CircleGuard</h1><p className="text-sm text-[#74807b]">Ajo built on verifiable trust</p></div></div>
        <div className="grid grid-cols-2 rounded-xl border border-[#e1e5e2] bg-[#f7f8f7] p-1">
          <button type="button" onClick={() => switchMode("signin")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "signin" ? "bg-white text-[#123f31] shadow-sm" : "text-[#7a8580]"}`}>Sign in</button>
          <button type="button" onClick={() => switchMode("signup")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "signup" ? "bg-white text-[#123f31] shadow-sm" : "text-[#7a8580]"}`}>Create account</button>
        </div>
        <h2 className="mt-8 text-3xl font-semibold tracking-tight">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
        <p className="mt-2 text-sm text-[#6f7b76]">{mode === "signin" ? "Enter your details to continue." : "Create your account without email verification."}</p>
        <form className="mt-7 space-y-5" onSubmit={authenticate}>
          <label className="block text-sm font-semibold">Email address<input className="input mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
          <label className="block text-sm font-semibold">Password<input className="input mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} required /></label>
          {message && <p className="rounded-xl bg-[#fff4e5] px-4 py-3 text-sm text-[#8a5a13]" role="status">{message}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#123f31] px-4 py-3.5 font-semibold text-white hover:bg-[#0d3327] disabled:opacity-60">{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}{!loading && <ArrowRight size={17} />}</button>
        </form>
        <div className="mt-6 flex items-start gap-3 border-t border-[#e7eae8] pt-5 text-xs leading-5 text-[#7a8580]"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#2b7659]" /><p>No confirmation email is sent. Your session is secured by Supabase.</p></div>
      </section>
    </main>
  );
}
