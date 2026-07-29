"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle } from "lucide-react";

export function CreateCircleSubmit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-[#123f31] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65">{pending ? <LoaderCircle size={16} className="animate-spin" /> : null}{pending ? "Creating…" : "Create circle"}{!pending && <ArrowRight size={16} />}</button>;
}
