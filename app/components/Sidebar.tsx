"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PenLine,
  Info,
  Megaphone,
  Bot,
  Settings,
  CreditCard,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Account } from "@/lib/accounts";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Draft Ready", href: "/?tab=toRespond", icon: PenLine },
  { label: "FYI", href: "/?tab=fyi", icon: Info },
  { label: "Marketing", href: "/?tab=newsletter", icon: Megaphone },
  { label: "Bot Mail", href: "/?tab=noise", icon: Bot },
];

interface SidebarProps {
  primaryAccount?: Account & { email: string };
}

export function Sidebar({ primaryAccount }: SidebarProps) {
  const pathname = usePathname();

  const initials = primaryAccount?.email
    ? primaryAccount.email.slice(0, 2).toUpperCase()
    : "LB";

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Link2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight tracking-tight">
            LinkBox
          </p>
          <p className="text-xs text-slate-400 leading-tight">AI inbox assistant</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
          Inbox
        </p>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/" && !pathname.includes("tab")
              : pathname === href.split("?")[0];
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Account
          </p>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/settings")
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </Link>
          <Link
            href="/pricing"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/pricing"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <CreditCard className="h-4 w-4 shrink-0" />
            Pricing
          </Link>
        </div>
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-semibold shrink-0"
            style={{ backgroundColor: primaryAccount?.color ?? "#3B82F6" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {primaryAccount?.label ?? "LinkBox"}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {primaryAccount?.email ?? "Connect an account"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
