"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  LineChart,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { useTrades } from "@/components/trades-provider";
import { AccountSwitcher } from "@/components/account-switcher";
import { AccountsManager } from "@/components/accounts-manager";
import { ALL_ACCOUNTS, useAccounts } from "@/components/accounts-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Journal", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mode, error } = useTrades();
  const [dark, setDark] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const { accounts, activeId } = useAccounts();
  const activeName =
    activeId === ALL_ACCOUNTS ? "All accounts" : (accounts.find((a) => a.id === activeId)?.name ?? "All accounts");

  useEffect(
    () => setDark(document.documentElement.classList.contains("dark")),
    [],
  );

  function toggleTheme() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  }

  async function signOut() {
    await getSupabase()?.auth.signOut();
  }

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <LineChart className="h-5 w-5" />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-[15px] font-semibold tracking-tight">
                Trading Journal
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {activeName}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <AccountSwitcher onManage={() => setManageOpen(true)} />
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {dark ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>
            {mode === "cloud" && (
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="border-b bg-loss/10 px-4 py-2 text-center text-xs text-loss">
          Sync problem: {error}
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
                pathname === href ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <AccountsManager open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  );
}
