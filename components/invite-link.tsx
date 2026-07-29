"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function InviteLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/join/${token}`;

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return <div className="rounded-2xl border border-[#cfe0d7] bg-[#f3f8f5] p-5"><p className="text-sm font-semibold text-[#245c46]">Invitation link ready</p><p className="mt-1 text-xs text-[#6d7c75]">This private link expires in seven days.</p><div className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-xl border border-[#d8e1dc] bg-white px-3 py-2.5 text-xs text-[#5f6d67]" readOnly value={path} /><button type="button" onClick={copyLink} className="flex shrink-0 items-center gap-2 rounded-xl bg-[#123f31] px-4 py-2.5 text-sm font-semibold text-white">{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Copied" : "Copy"}</button></div></div>;
}
