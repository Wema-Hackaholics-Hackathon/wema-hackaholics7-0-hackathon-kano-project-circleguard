"use client";

import { Trash2 } from "lucide-react";
import { removeMember } from "@/app/circles/[id]/actions";

export function RemoveMemberForm({ circleId, profileId, memberName }: { circleId: string; profileId: string; memberName: string }) {
  return <form action={removeMember} onSubmit={(event) => { if (!window.confirm(`Remove ${memberName} from this circle?`)) event.preventDefault(); }}><input type="hidden" name="circle_id" value={circleId} /><input type="hidden" name="profile_id" value={profileId} /><button className="flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"><Trash2 size={14} /> Remove</button></form>;
}
