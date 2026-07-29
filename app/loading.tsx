import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return <main className="grid min-h-[60vh] place-items-center bg-[#fafbfa] p-6" aria-live="polite" aria-busy="true">
    <div className="flex flex-col items-center text-center"><LoaderCircle size={26} className="animate-spin text-[#2b7659]" /><p className="mt-3 text-sm font-semibold text-[#405048]">Loading CircleGuard…</p><p className="mt-1 text-xs text-[#78847f]">Please wait while we prepare this page.</p></div>
  </main>;
}
