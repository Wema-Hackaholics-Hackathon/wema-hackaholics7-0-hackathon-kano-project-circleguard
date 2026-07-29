import Link from "next/link";
import {
  Activity,
  CircleDollarSign,
  CreditCard,
  HelpCircle,
  Home,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { signOut } from "@/app/dashboard/actions";

const primary = [
  { label: "Overview", href: "/dashboard", icon: Home },
  { label: "My circles", href: "/circles", icon: CircleDollarSign },
  { label: "Members", href: "/dashboard", icon: Users },
  { label: "Activity", href: "/dashboard", icon: Activity },
];

const manage = [
  { label: "Bank connections", href: "/bank", icon: CreditCard },
  { label: "Privacy & consent", href: "/dashboard", icon: ShieldCheck },
];

export function AppShell({
  children,
  active = "Overview",
}: {
  children: React.ReactNode;
  active?: string;
}) {
  return (
    <div className="min-h-screen bg-[#f4f5f3] text-[#17211d] lg:p-4">
      <div className="mx-auto flex min-h-screen max-w-[1500px] overflow-hidden border-[#e3e7e4] bg-white lg:h-[calc(100vh-2rem)] lg:min-h-0 lg:rounded-[22px] lg:border lg:shadow-[0_18px_60px_rgba(25,46,38,0.08)]">
        <aside className="hidden h-full w-[256px] shrink-0 flex-col border-r border-[#e4e7e5] bg-white p-5 lg:flex">
          <Link href="/dashboard" className="flex items-center gap-3 px-2 py-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#123f31] text-sm font-bold text-white">CG</span>
            <span><strong className="block text-[17px]">CircleGuard</strong><small className="text-xs text-[#84908b]">VERIFIED SAVINGS</small></span>
          </Link>
          <nav className="mt-8 space-y-7">
            <NavGroup items={primary} active={active} />
            <NavGroup title="MANAGE" items={manage} active={active} />
            <NavGroup title="ACCOUNT" items={[
              { label: "Settings", href: "/dashboard", icon: Settings },
              { label: "Help centre", href: "/dashboard", icon: HelpCircle },
            ]} active={active} />
          </nav>
          <form action={signOut} className="mt-auto">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#65716c] hover:bg-[#f1f3f2] hover:text-[#17211d]"><LogOut size={18} /> Log out</button>
          </form>
        </aside>
        <div className="min-h-screen min-w-0 flex-1 bg-[#fafbfa] lg:h-full lg:min-h-0 lg:overflow-y-auto">
          <header className="flex h-16 items-center justify-between border-b border-[#e4e7e5] bg-white px-5 lg:hidden">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold"><span className="grid size-8 place-items-center rounded-full bg-[#123f31] text-xs text-white">CG</span> CircleGuard</Link>
            <Link href="/circles/new" className="grid size-9 place-items-center rounded-lg bg-[#123f31] text-white" aria-label="Create circle"><Plus size={18} /></Link>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}

function NavGroup({ title, items, active }: { title?: string; items: typeof primary; active: string }) {
  return <div>{title && <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.14em] text-[#a1aaa6]">{title}</p>}<div className="space-y-1">{items.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active === label ? "bg-[#eef2f0] text-[#123f31]" : "text-[#65716c] hover:bg-[#f5f7f6] hover:text-[#17211d]"}`}><Icon size={18} strokeWidth={1.8} />{label}</Link>)}</div></div>;
}
