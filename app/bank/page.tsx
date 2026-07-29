import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OpenBankingDemo } from "@/components/open-banking-demo";

export default async function BankPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return <AppShell active="Bank connections"><main className="p-5 sm:p-7 xl:p-10"><div className="mx-auto max-w-3xl"><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[#66736d]"><ArrowLeft size={16} /> Back to overview</Link><div className="mt-6"><p className="text-sm font-semibold text-[#2b7659]">REQUIRED SETUP</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">Connect your demo bank</h1><p className="mt-2 text-sm leading-6 text-[#6f7b76]">Every CircleGuard member must connect a private bank profile before creating or joining a circle.</p></div><div className="mt-8"><OpenBankingDemo contributionAmount={20000} nextPath={nextPath} /></div></div></main></AppShell>;
}
