"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { circleLiveVersion } from "@/lib/circle-live-version";

export function CircleLiveRefresh({ circleId, initialVersion }: { circleId: string; initialVersion: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    let currentVersion = initialVersion;
    let checking = false;
    const checkForChanges = async () => {
      if (checking || document.visibilityState !== "visible") return;
      checking = true;
      try {
        const [{ data: circle }, { data: members }, { data: latestCycle }] = await Promise.all([
          supabase.from("circles").select("status").eq("id", circleId).maybeSingle(),
          supabase.from("circle_members").select("profile_id,status,payout_position").eq("circle_id", circleId).in("status", ["active", "invited"]),
          supabase.from("circle_cycles").select("cycle_number").eq("circle_id", circleId).order("cycle_number", { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (!circle) return;
        const nextVersion = circleLiveVersion(circle.status, members ?? [], latestCycle?.cycle_number ?? 0);
        if (nextVersion !== currentVersion) {
          currentVersion = nextVersion;
          router.refresh();
        }
      } finally {
        checking = false;
      }
    };
    const interval = window.setInterval(checkForChanges, 2500);
    window.addEventListener("focus", checkForChanges);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", checkForChanges); };
  }, [circleId, initialVersion, router]);
  return null;
}
