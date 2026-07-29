"use client";

import { useFormStatus } from "react-dom";
import { Copy, LoaderCircle } from "lucide-react";
import { generateInvitation } from "@/app/circles/[id]/actions";

export function GenerateInvitationForm({ circleId }: { circleId: string }) {
  return <form action={generateInvitation}><input type="hidden" name="circle_id" value={circleId} /><GenerateButton /></form>;
}

function GenerateButton() {
  const { pending } = useFormStatus();
  return <div className="mt-5"><button type="submit" disabled={pending} className="flex min-w-48 items-center justify-center gap-2 rounded-xl bg-[#123f31] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-65">{pending ? <LoaderCircle size={16} className="animate-spin" /> : <Copy size={16} />}{pending ? "Generating link…" : "Generate invite link"}</button>{pending && <p className="mt-3 text-xs text-[#78847f]" aria-live="polite">Please wait while your reusable invitation link is created.</p>}</div>;
}
