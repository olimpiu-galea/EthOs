"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Ban,
  FileSpreadsheet,
  Package,
  PlugZap,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConnectionRowState = {
  connected: boolean;
  loading: boolean;
  error: string | null;
  stale?: boolean;
  lastSync?: number | null;
  onConnect: () => void;
  onDisconnect: () => void;
  /** Extra actions when connected (e.g. lab upload) */
  connectedActions?: ReactNode;
  detail?: string;
  historySyncing?: boolean;
};

type FeedId = "dcs" | "lab" | "commodity" | "inventory";

type FeedDefinition = {
  id: FeedId;
  name: string;
  format: string;
  capabilities: string;
  refresh: string;
  icon: LucideIcon;
};

const FEED_DEFINITIONS: FeedDefinition[] = [
  {
    id: "dcs",
    name: "DCS · process signals",
    format: "Live tags",
    capabilities: "Timeline replay, playbook evaluation",
    refresh: "~60s",
    icon: PlugZap,
  },
  {
    id: "lab",
    name: "Lab Sheet",
    format: "XLSX / CSV",
    capabilities: "Field mapping, cross-source rules",
    refresh: "On upload",
    icon: FileSpreadsheet,
  },
  {
    id: "commodity",
    name: "Financial",
    format: "Financial feed",
    capabilities: "Sell vs hold, financial playbooks",
    refresh: "~60s",
    icon: TrendingUp,
  },
  {
    id: "inventory",
    name: "Procurement",
    format: "SKU ledger",
    capabilities: "Reorder alerts, operational playbooks",
    refresh: "~60s",
    icon: Package,
  },
];

function StatusPill({ connected, stale }: { connected: boolean; stale?: boolean }) {
  if (!connected) {
    return (
      <Badge
        variant="secondary"
        className="whitespace-nowrap text-[10px] font-medium px-2 py-0 h-5"
      >
        Available
      </Badge>
    );
  }
  if (stale) {
    return (
      <Badge variant="warning" className="text-[10px] h-5">
        Stale
      </Badge>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      Live
    </span>
  );
}

function formatLastSync(ts?: number | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type HubProps = {
  phrase2Enabled?: boolean;
  showDcs?: boolean;
  showLab?: boolean;
  showCommodity?: boolean;
  showInventory?: boolean;
  dcs: ConnectionRowState;
  lab: ConnectionRowState;
  commodity: ConnectionRowState;
  inventory: ConnectionRowState;
};

function feedVisible(
  id: FeedId,
  props: HubProps,
): boolean {
  const { phrase2Enabled = true } = props;
  switch (id) {
    case "dcs":
      return props.showDcs !== false;
    case "lab":
      return props.showLab !== false;
    case "commodity":
      return phrase2Enabled && props.showCommodity !== false;
    case "inventory":
      return phrase2Enabled && props.showInventory !== false;
    default:
      return false;
  }
}

function rowState(id: FeedId, props: HubProps): ConnectionRowState {
  switch (id) {
    case "dcs":
      return props.dcs;
    case "lab":
      return props.lab;
    case "commodity":
      return props.commodity;
    case "inventory":
      return props.inventory;
  }
}

export function ConnectionHub(props: HubProps) {
  const visibleFeeds = FEED_DEFINITIONS.filter((f) => feedVisible(f.id, props));
  const dcsSyncing = props.dcs.historySyncing;

  return (
    <section className="space-y-3 w-full max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">Connections</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connect the signal sources enabled for your company.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 self-start"
        >
          <Link href="/settings?tab=features">
            <Plus className="h-4 w-4" />
            Add signal sources
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden w-full">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium w-[22%]">Source</th>
              <th className="px-4 py-3 font-medium w-[11%]">Format</th>
              <th className="px-4 py-3 font-medium w-[24%]">Capabilities</th>
              <th className="px-4 py-3 font-medium w-[9%]">Refresh</th>
              <th className="px-4 py-3 font-medium w-[10%]">Status</th>
              <th className="px-4 py-3 font-medium w-[14%]">Last sync</th>
              <th className="px-4 py-3 font-medium w-[10%] text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleFeeds.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center">
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    No signal feeds enabled for this company. Turn on DCS, Lab Sheet,
                    or other sources before you can connect them here.
                  </p>
                  <Link
                    href="/settings?tab=features"
                    className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    Open Settings → Features
                  </Link>
                </td>
              </tr>
            ) : (
              visibleFeeds.map((feed) => {
                const state = rowState(feed.id, props);
                const Icon = feed.icon;

                return (
                  <tr
                    key={feed.id}
                    className={cn(
                      "border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors",
                      state.connected && "bg-primary/[0.02]",
                    )}
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "shrink-0 rounded-lg p-1.5 ring-1",
                            state.connected
                              ? "bg-primary/15 ring-primary/25"
                              : "bg-muted/40 ring-border/50",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              state.connected
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          />
                        </div>
                        <span className="font-medium truncate">{feed.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-muted-foreground">
                      {feed.format}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                        {feed.capabilities}
                      </p>
                      {state.connected && state.detail && (
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">
                          {state.detail}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                      {feed.refresh}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <StatusPill connected={state.connected} stale={state.stale} />
                    </td>
                    <td className="px-4 py-3 align-middle text-xs tabular-nums text-muted-foreground">
                      {state.connected ? formatLastSync(state.lastSync) : "—"}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        {state.connected && state.connectedActions}
                        {!state.connected ? (
                          <Button
                            onClick={state.onConnect}
                            disabled={state.loading}
                            size="sm"
                            className="gap-1 h-8 text-xs px-3 shrink-0"
                          >
                            <PlugZap className="h-3.5 w-3.5" />
                            {state.loading ? "…" : "Connect"}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={state.onDisconnect}
                            size="icon"
                            className="h-7 w-7 shrink-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            title="Disconnect"
                            aria-label="Disconnect"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {state.error && (
                        <p className="mt-1 text-[10px] text-destructive flex items-center gap-1 justify-end">
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[8rem]" title={state.error}>
                            {state.error}
                          </span>
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {dcsSyncing && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Syncing playbook history to agenda…
        </p>
      )}
    </section>
  );
}
