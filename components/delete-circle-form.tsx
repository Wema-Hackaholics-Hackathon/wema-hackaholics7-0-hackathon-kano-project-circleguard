"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteCircle } from "@/app/circles/[id]/actions";

export function DeleteCircleForm({ circleId }: { circleId: string; circleName: string }) {
  return <form action={deleteCircle}><input type="hidden" name="circle_id" value={circleId} /><DeleteButton /></form>;
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">{pending ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}{pending ? "Deleting…" : "Delete circle"}</button>;
}
