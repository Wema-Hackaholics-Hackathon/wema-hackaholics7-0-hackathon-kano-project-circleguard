"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export function JoinApprovalWatcher() {
  const router = useRouter();
  useEffect(() => {
    const check = () => { if (document.visibilityState === "visible") router.refresh(); };
    const interval = window.setInterval(check, 2500);
    window.addEventListener("focus", check);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", check); };
  }, [router]);
  return <p className="mt-3 flex items-center justify-center gap-2 text-xs text-[#6b7a73]"><LoaderCircle size={13} className="animate-spin" /> Waiting for administrator approval…</p>;
}
