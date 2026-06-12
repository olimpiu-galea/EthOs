"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  BookOpen,
  CalendarDays,
  FileBarChart,
  Home,
  LogOut,
  Radio,
  Settings,
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
  extrasNavLabel,
} from "@/lib/role-access";
import { OperationsSuiteToggle } from "@/components/operations-suite-toggle";
import { ROLE_LABELS, canManageSettings } from "@/lib/auth-constants";

const BASE_MAIN_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/integrations", label: "Integrations", icon: Radio },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/reports", label: "Reports", icon: FileBarChart },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const companyName = useSettingsStore((s) => s.companyName);
  const domain = useSettingsStore((s) => s.domain);
  const operationsSuiteEnabled = useSettingsStore(
    (s) => s.operationsSuiteEnabled,
  );
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

  const role = user?.role ?? "operational";
  const mainNav = BASE_MAIN_NAV.filter(
    (item) => item.href !== "/integrations" || canSeeIntegrations(role),
  );
  const suiteNav = buildSuiteNav(domain, role, {
    commodityConnected,
    operationsSuiteEnabled,
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
        <span className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </span>
      );
    }
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </Link>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 border-r border-border/60 bg-card/50 flex flex-col shrink-0">
        <div className="p-6 border-b border-border/60">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-7 w-7 text-primary" />
            <div>
              <p className="font-semibold tracking-tight">
                <span>Signal</span>
                <span className="text-primary">Relay</span>
              </p>
              <p className="text-xs text-muted-foreground">{companyName}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {mainNav.map(({ href, label, icon: Icon }) =>
            navLink(href, label, Icon),
          )}

          {user && canManageSettings(user.role) && (
            <div className="mt-4 pt-2 border-t border-border/40">
              {navLink("/settings", "Settings", Settings)}
            </div>
          )}

          <div className="relative mt-4 rounded-xl border border-primary/25 bg-gradient-to-b from-primary/5 to-transparent p-2 space-y-0.5">
            <p className="px-2 pt-1 pb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-primary/70">
              {extrasNavLabel(role)}
            </p>
            {suiteNav.map(({ href, label, icon: Icon, ready }) =>
              navLink(href, label, Icon, !ready),
            )}
            <OperationsSuiteToggle />
          </div>
        </nav>

        <div className="p-4 border-t border-border/60 space-y-2">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Signal sources
            </p>
            <Badge variant={connectedCount > 0 ? "success" : "secondary"}>
              {connectedCount > 0
                ? `${connectedCount} connected`
                : "Disconnected"}
            </Badge>
            {lastSync && (
              <p className="text-xs text-muted-foreground">
                DCS sync: {new Date(lastSync).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-end gap-3 border-b border-border/60 bg-background/80 backdrop-blur-sm px-6 py-2.5 shrink-0">
          {user && (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.name}
                <span className="mx-1.5 text-border">·</span>
                {ROLE_LABELS[user.role]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </>
          )}
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
