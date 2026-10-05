"use client";

import { CreditCard, LayoutDashboard, LogOut, Menu as MenuIcon, Plus, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import useSWR, { SWRConfig } from "swr";
import { BrandLogo } from "@/components/brand";
import { LinkButton } from "@/components/ui/button";
import { ConfirmProvider } from "@/components/ui/confirm";
import { Skeleton } from "@/components/ui/feedback";
import { api, fetcher } from "@/lib/api";
import type { AdminUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/cards", label: "Cards", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminContext = createContext<AdminUser | null>(null);
export const useAdmin = () => useContext(AdminContext);

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, keepPreviousData: true, revalidateOnFocus: true, shouldRetryOnError: false }}>
      <ConfirmProvider>
        <Shell>{children}</Shell>
      </ConfirmProvider>
    </SWRConfig>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // The drawer remembers the path it was opened on, so navigating closes it.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawer = drawerPath === pathname;
  const setDrawer = (open: boolean) => setDrawerPath(open ? pathname : null);
  const { data } = useSWR<{ admin: AdminUser }>("/auth/me");

  // The full-screen editor brings its own chrome.
  const fullscreen = /^\/admin\/cards\/[^/]+\/edit$/.test(pathname);

  async function signOut() {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Main" className="space-y-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const account = (
    <div className="flex items-center gap-3 border-t border-line pt-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-ink-2">
        {data?.admin.name?.[0]?.toUpperCase() ?? "·"}
      </div>
      <div className="min-w-0 flex-1">
        {data ? (
          <>
            <p className="truncate text-sm font-medium text-ink">{data.admin.name}</p>
            <p className="truncate text-xs text-ink-3">{data.admin.email}</p>
          </>
        ) : (
          <>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-32" />
          </>
        )}
      </div>
      <button onClick={signOut} className="rounded-md p-2 text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label="Sign out" title="Sign out">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );

  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/admin" className="px-2 pt-1">
        <BrandLogo />
      </Link>
      <LinkButton href="/admin/cards/new" variant="primary" icon={<Plus className="h-4 w-4" />} className="w-full">
        New card
      </LinkButton>
      <div className="flex-1">{nav}</div>
      {account}
    </div>
  );

  return (
    <AdminContext.Provider value={data?.admin ?? null}>
      {fullscreen ? (
        children
      ) : (
        <div className="min-h-dvh lg:pl-64">
          <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface lg:block">{sidebar}</aside>

          {/* Mobile top bar + drawer */}
          <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
            <Link href="/admin">
              <BrandLogo />
            </Link>
            <button onClick={() => setDrawer(true)} className="rounded-md p-2 text-ink-2 hover:bg-surface-2" aria-label="Open menu">
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
          {drawer && (
            <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
              <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawer(false)} />
              <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-xl">
                <button
                  onClick={() => setDrawer(false)}
                  className="absolute top-4 right-3 rounded-md p-2 text-ink-3 hover:bg-surface-2"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
                {sidebar}
              </div>
            </div>
          )}

          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      )}
    </AdminContext.Provider>
  );
}
