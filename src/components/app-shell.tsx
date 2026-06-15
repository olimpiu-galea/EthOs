"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  FileBarChart,
  Home,
  LogOut,
  Menu,
  Radio,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDcsStore } from "@/stores/dcs-store";
import { useLabStore } from "@/stores/lab-store";
import { useCommodityStore } from "@/stores/commodity-store";
import { useInventoryStore } from "@/stores/inventory-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlaybookEvaluation } from "@/hooks/use-playbook-evaluation";
import { useLabGatedMockPlaybooksGate } from "@/hooks/use-lab-gated-mock-playbooks-gate";
import { useAlertHistoryStore } from "@/stores/alert-history-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
  buildSuiteNav,
  canSeeIntegrations,
} from "@/lib/role-access";
import { ROLE_LABELS, canManageSettings } from "@/lib/auth-constants";
import { EthOsWordmark } from "@/components/brand/ethos-wordmark";

const BASE_MAIN_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/copilot", label: "Plant Copilot", icon: Sparkles },
  { href: "/integrations", label: "Integrations", icon: Radio },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: FileBarChart },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const companyName = useSettingsStore((s) => s.companyName);
  const domain = useSettingsStore((s) => s.domain);
  const operationsSuiteEnabled = useSettingsStore(
    (s) => s.operationsSuiteEnabled,
  );
  const companyFeeds = useSettingsStore((s) => s.companyFeeds);
  const dcsConnected = useDcsStore((s) => s.connected);
  const labConnected = useLabStore((s) => s.connected);
  const commodityConnected = useCommodityStore((s) => s.connected);
  const inventoryConnected = useInventoryStore((s) => s.connected);
  const lastSync = useDcsStore((s) => s.lastSync);
  usePlaybookEvaluation();
  useLabGatedMockPlaybooksGate();

  useEffect(() => {
    const t = setInterval(() => {
      useAlertHistoryStore.getState().checkEscalations();
    }, 60_000);
    useAlertHistoryStore.getState().checkEscalations();
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  const role = user?.role ?? "operational";
  const mainNav = BASE_MAIN_NAV.filter(
    (item) => item.href !== "/integrations" || canSeeIntegrations(role),
  );
  const suiteNav = buildSuiteNav(domain, role, {
    operationsSuiteEnabled,
    companyFeeds,
  });
  const connectedCount = [
    dcsConnected,
    labConnected,
    commodityConnected,
    inventoryConnected,
  ].filter(Boolean).length;

  function navLink(
    href: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    disabled?: boolean,
  ) {
    const active = pathname === href || pathname.startsWith(href + "/");
    if (disabled) {
      return (
        <span className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-muted/50 cursor-not-allowed">
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </span>
      );
    }
    return (
      <Link
        href={href}
        onClick={() => setNavOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-white"
            : "text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-white",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </Link>
    );
  }

  const sidebar = (
    <>
      <div className="p-5 border-b border-sidebar-border">
        <EthOsWordmark variant="sidebar" />
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {mainNav.map(({ href, label, icon: Icon }) =>
          navLink(href, label, Icon),
        )}

        {user && canManageSettings(user.role) && (
          <div className="mt-3 pt-3 border-t border-sidebar-border">
            {navLink("/settings", "Settings", Settings)}
          </div>
        )}

        <div className="relative mt-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-2 space-y-0.5">
          <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
            Dashboards
          </p>
          {suiteNav.map(({ href, label, icon: Icon, ready }) =>
            navLink(href, label, Icon, !ready),
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <p className="text-[10px] text-sidebar-muted uppercase tracking-wider">
          Signal sources
        </p>
        <Badge
          variant={connectedCount > 0 ? "success" : "secondary"}
          className="bg-sidebar-accent border-sidebar-border text-white"
        >
          {connectedCount > 0
            ? `${connectedCount} connected`
            : "Disconnected"}
        </Badge>
        {lastSync && (
          <p className="text-[11px] text-sidebar-muted">
            DCS sync: {new Date(lastSync).toLocaleTimeString()}
          </p>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside
        className={cn(
          "w-64 bg-sidebar text-sidebar-foreground flex-col shrink-0 border-r border-sidebar-border",
          "lg:flex",
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:flex max-lg:transition-transform max-lg:duration-200 max-lg:ease-out",
          navOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
        )}
      >
        {sidebar}
      </aside>
      <div className="flex-1 flex flex-col min-w-0 bg-card">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border bg-card/95 backdrop-blur-sm px-6 max-lg:px-4 py-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 lg:hidden"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                {companyName}
              </p>
            </div>
            <div className="min-w-0 sm:hidden">
              <p className="text-lg font-bold tracking-tight text-foreground truncate">
                {companyName}
              </p>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm text-muted-foreground hidden md:inline text-right">
                {user.name}
                <span className="mx-1.5 text-border">·</span>
                {ROLE_LABELS[user.role]}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
