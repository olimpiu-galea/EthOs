"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BarChart3,
  Boxes,
  LineChart,
  Plug,
  PlugZap,
  Radio,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DcsConnectionProps = {
  connected: boolean;
  loading: boolean;
  historySyncing: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
};

function StatusPill({
  connected,
  syncing,
}: {
  connected: boolean;
  syncing: boolean;
}) {
  if (!connected) {
    return (
      <Badge variant="secondary" className="font-medium px-3">
        Available
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Live
      </span>
      {syncing && (
        <Badge variant="outline" className="animate-pulse text-xs">
          Syncing agenda…
        </Badge>
      )}
    </div>
  );
}

function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      {children}
    </span>
  );
}

export function DcsConnectionCard({
  connected,
  loading,
  historySyncing,
  error,
  onConnect,
  onDisconnect,
}: DcsConnectionProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card h-full transition-shadow duration-300",
        connected
          ? "border-primary/35 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.45)]"
          : "border-border/70 shadow-sm",
      )}
    >
      {connected && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-emerald-500/[0.04] pointer-events-none" />
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        </>
      )}

      <div className="relative flex flex-col h-full p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6 flex-1">
          <div
            className={cn(
              "shrink-0 rounded-2xl p-4 ring-1 self-start",
              connected
                ? "bg-primary/15 ring-primary/25"
                : "bg-muted/40 ring-border/50",
            )}
          >
            <PlugZap
              className={cn(
                "h-8 w-8",
                connected ? "text-primary" : "text-muted-foreground",
              )}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <h3 className="text-xl font-semibold tracking-tight">
                  DCS · signal source
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                  First connected source: live process signals from the
                  distributed control system. Demo loads fixture CSV and
                  timeline.
                </p>
              </div>
              <StatusPill connected={connected} syncing={historySyncing} />
            </div>

            <div className="flex flex-wrap gap-2">
              <FeaturePill>9-field tag template · ~60s refresh</FeaturePill>
              <FeaturePill>Signals for playbooks & agenda</FeaturePill>
            </div>

            {connected && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg border border-border/50 bg-muted/20 px-3 py-2 w-fit">
                <Radio className="h-3.5 w-3.5 text-primary" />
                Streaming live signals (demo)
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {connected
              ? "Disconnect to stop live tag updates"
              : "Connect to load tags and enable playbooks"}
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
            {!connected ? (
              <Button
                size="lg"
                onClick={onConnect}
                disabled={loading}
                className="gap-2 shadow-md shadow-primary/20 min-w-[180px]"
              >
                <PlugZap className="h-5 w-5" />
                {loading ? "Connecting…" : "Connect source"}
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                onClick={onDisconnect}
                className="gap-2 border-border/80 bg-background/50 hover:bg-muted/50 min-w-[160px]"
              >
                <Plug className="h-5 w-5" />
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function ComingSoonTile({
  icon: Icon,
  title,
  subtitle,
  accent,
  features,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accent: "amber" | "violet";
  features: string[];
}) {
  const accentStyles = {
    amber: {
      border: "border-amber-500/20 hover:border-amber-500/35",
      bg: "bg-gradient-to-br from-amber-500/12 via-card/80 to-card",
      icon: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
      dot: "bg-amber-400",
      glow: "bg-amber-500/15",
    },
    violet: {
      border: "border-violet-500/20 hover:border-violet-500/35",
      bg: "bg-gradient-to-br from-violet-500/12 via-card/80 to-card",
      icon: "bg-violet-500/15 text-violet-400 ring-violet-500/25",
      dot: "bg-violet-400",
      glow: "bg-violet-500/15",
    },
  };
  const s = accentStyles[accent];

  return (
    <div
      className={cn(
        "group relative rounded-xl border p-5 flex flex-col min-h-[240px] overflow-hidden transition-colors",
        s.border,
        s.bg,
      )}
    >
      <div
        className={cn(
          "absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-40 pointer-events-none transition-opacity group-hover:opacity-60",
          s.glow,
        )}
      />
      <div className="relative flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "inline-flex rounded-xl p-3 ring-1 ring-inset",
              s.icon,
            )}
          >
            <Icon className="h-7 w-7" />
          </div>
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-wider opacity-70 shrink-0"
          >
            Soon
          </Badge>
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground leading-snug">
            {subtitle}
          </p>
        </div>
        <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground flex-1">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <span
                className={cn("h-1.5 w-1.5 rounded-full mt-2 shrink-0", s.dot)}
              />
              <span className="leading-snug">{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Integration in development
          </p>
        </div>
      </div>
    </div>
  );
}

export function ComingSoonIntegrations() {
  return (
    <div className="relative h-full rounded-xl border border-dashed border-muted-foreground/20 bg-muted/[0.03] overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--primary)/0.06),_transparent_55%)] pointer-events-none" />

      <div className="relative px-5 py-4 sm:px-6 border-b border-border/40 flex flex-wrap items-center justify-between gap-3 bg-muted/10">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Roadmap
          </p>
          <h3 className="text-base font-semibold mt-0.5">
            Upcoming integrations
          </h3>
        </div>
        <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/15 px-3 py-1">
          Coming soon
        </Badge>
      </div>

      <div className="relative flex-1 p-5 sm:p-6 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 flex-1">
          <ComingSoonTile
            icon={Boxes}
            title="Inventory"
            subtitle="Materials, batches & stock across the site"
            accent="amber"
            features={[
              "Real-time stock and consumption views",
              "Link inventory moves to live signal events",
              "Low-stock alerts in playbooks",
            ]}
          />
          <ComingSoonTile
            icon={LineChart}
            title="Trading on market"
            subtitle="Financial advice based on market signals"
            accent="violet"
            features={[
              "Market-linked pricing & margin outlook",
              "AI-assisted hedging recommendations",
              "Align trades with production playbooks",
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground rounded-full border border-border/50 bg-card/60 px-3 py-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-primary/70" />
            Analytics
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground rounded-full border border-border/50 bg-card/60 px-3 py-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary/70" />
            Financial insights
          </span>
        </div>
      </div>
    </div>
  );
}

export function ConnectionHub(props: DcsConnectionProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Connections</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Data sources for operations, inventory, and market insights
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-12 xl:items-stretch">
        <div className="xl:col-span-5 min-h-[280px]">
          <DcsConnectionCard {...props} />
        </div>
        <div className="xl:col-span-7 min-h-[280px]">
          <ComingSoonIntegrations />
        </div>
      </div>
    </section>
  );
}
