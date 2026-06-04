"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  CalendarDays,
  FileBarChart,
  Home,
  Layers,
  Monitor,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDcsStore } from "@/stores/dcs-store";
import { Badge } from "@/components/ui/badge";
import { usePlaybookEvaluation } from "@/hooks/use-playbook-evaluation";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/integrations", label: "Integrations", icon: Radio },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
];

const plantSuiteNav = [
  { href: "/dcs", label: "DCS", icon: Monitor },
  { href: "/batches", label: "Batches", icon: Layers },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const connected = useDcsStore((s) => s.connected);
  const lastSync = useDcsStore((s) => s.lastSync);
  usePlaybookEvaluation();

  function navLink(href: string, label: string, Icon: React.ComponentType<{ className?: string }>) {
    const active = pathname === href;
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
            <Activity className="h-7 w-7 text-primary" />
            <div>
              <p className="font-semibold tracking-tight">EthOS</p>
              <p className="text-xs text-muted-foreground">Plant operations</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {mainNav.map(({ href, label, icon: Icon }) =>
            navLink(href, label, Icon),
          )}

          <div className="relative mt-4 rounded-xl border border-primary/25 bg-gradient-to-b from-primary/5 to-transparent p-2 space-y-0.5">
            <p className="px-2 pt-1 pb-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-primary/70">
              Plant suite
            </p>
            {plantSuiteNav.map(({ href, label, icon: Icon }) =>
              navLink(href, label, Icon),
            )}
            <span className="absolute bottom-1.5 right-1.5 text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-violet-400/40 bg-violet-500/15 text-violet-300 pointer-events-none">
              Soon
            </span>
          </div>
        </nav>
        <div className="p-4 border-t border-border/60 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Signal source
          </p>
          <Badge variant={connected ? "success" : "secondary"}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
          {connected && lastSync && (
            <p className="text-xs text-muted-foreground">
              Last sync: {new Date(lastSync).toLocaleTimeString()}
            </p>
          )}
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
