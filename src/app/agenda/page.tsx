"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Circle, Radio, RefreshCw } from "lucide-react";
import {
  useAlertHistoryStore,
  latestAgendaItems,
  filterItemsForDate,
  AGENDA_LATEST_LIMIT,
} from "@/stores/alert-history-store";
import { localDateKey } from "@/lib/dcs-timeline";
import { syncAllPlaybooksToAgenda } from "@/lib/sync-agenda";
import { resolveAgendaDateKey, loadTimeline } from "@/lib/timeline-loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useDcsStore } from "@/stores/dcs-store";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AgendaPage() {
  const todayKey = localDateKey();
  const items = useAlertHistoryStore((s) => s.items);
  const hasHydrated = useAlertHistoryStore((s) => s._hasHydrated);
  const refreshStatuses = useAlertHistoryStore((s) => s.refreshStatuses);
  const playbooks = usePlaybookStore((s) => s.playbooks);
  const connected = useDcsStore((s) => s.connected);
  const lastSync = useDcsStore((s) => s.lastSync);
  const [syncing, setSyncing] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const prevCountRef = useRef(0);
  const [agendaDateKey, setAgendaDateKey] = useState(todayKey);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (useAlertHistoryStore.persist.hasHydrated()) {
      useAlertHistoryStore.getState().setHasHydrated(true);
    }
  }, []);

  const runSync = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const timeline = await loadTimeline();
      if (!timeline) {
        setSyncError("Timeline file not found. Run npm run generate:timeline");
        return;
      }
      setAgendaDateKey(resolveAgendaDateKey(timeline));
      const count = await syncAllPlaybooksToAgenda();
      if (count === 0 && playbooks.length > 0) {
        setSyncError(
          "No alerts matched today. Check playbook conditions (e.g. Reactor Temp PV > 90).",
        );
      }
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [playbooks.length]);

  /** Light background sync — does not block the list */
  useEffect(() => {
    if (!hasHydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const timeline = await loadTimeline();
        if (cancelled || !timeline) return;
        setAgendaDateKey(resolveAgendaDateKey(timeline));
        await syncAllPlaybooksToAgenda();
      } catch {
        /* keep showing cached items */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, playbooks.length]);

  useEffect(() => {
    refreshStatuses();
    const t = setInterval(() => refreshStatuses(), 30_000);
    return () => clearInterval(t);
  }, [refreshStatuses]);

  /** Re-render when live DCS evaluation adds an alert (AppShell hook) */
  useEffect(() => {
    if (lastSync) refreshStatuses();
  }, [lastSync, refreshStatuses]);

  const allTodayItems = useMemo(
    () => filterItemsForDate(items, agendaDateKey),
    [items, agendaDateKey],
  );

  const todayItems = useMemo(
    () => latestAgendaItems(items, agendaDateKey, AGENDA_LATEST_LIMIT),
    [items, agendaDateKey],
  );

  const completed = todayItems.filter((i) => i.status === "completed").length;
  const active = todayItems.filter((i) => i.status === "active").length;
  const hiddenCount = Math.max(0, allTodayItems.length - todayItems.length);
  const usingFallbackDate = agendaDateKey !== todayKey;

  useEffect(() => {
    if (todayItems.length > prevCountRef.current) {
      const newest = todayItems[0];
      if (newest) {
        setHighlightId(newest.id);
        const t = setTimeout(() => setHighlightId(null), 4000);
        prevCountRef.current = todayItems.length;
        return () => clearTimeout(t);
      }
    }
    prevCountRef.current = todayItems.length;
  }, [todayItems]);

  const todayLabel = new Date(
    agendaDateKey + "T12:00:00",
  ).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Latest {AGENDA_LATEST_LIMIT} alerts by time — newest at the top.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void runSync()}
          disabled={syncing || !hasHydrated}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          Refresh agenda
        </Button>
      </header>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-xl">{todayLabel}</CardTitle>
              <CardDescription>
                {usingFallbackDate
                  ? `Demo data day (${agendaDateKey}) — regenerate timeline for today`
                  : "Selected date: today"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 text-sm">
          <span>
            <strong className="text-foreground">{todayItems.length}</strong>{" "}
            shown
            {hiddenCount > 0 && (
              <span className="text-muted-foreground">
                {" "}
                ({allTodayItems.length} total today)
              </span>
            )}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-amber-400">{active} active</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-emerald-400">{completed} completed</span>
          <span className="text-muted-foreground">·</span>
          <span>{playbooks.length} playbooks</span>
        </CardContent>
      </Card>

      <div
        className={cn(
          "flex flex-wrap items-center gap-2 text-sm rounded-lg border px-4 py-3",
          connected
            ? "border-primary/30 bg-primary/5"
            : "border-border bg-muted/20",
        )}
      >
        <Radio
          className={cn(
            "h-4 w-4 shrink-0",
            connected ? "text-primary" : "text-muted-foreground",
          )}
        />
        <span>
          <strong className={connected ? "text-primary" : "text-foreground"}>
            Live
          </strong>
          {" — "}
          {connected ? (
            <>
              new alerts appear here automatically about every 60 seconds
              when the signal source refreshes
              {lastSync
                ? ` (last check ${new Date(lastSync).toLocaleTimeString()})`
                : ""}
              . You also get a toast notification. Active playbooks only.
            </>
          ) : (
            <>
              connect a signal source on Integrations for automatic updates.
              Showing latest
              saved alerts below.
            </>
          )}
        </span>
      </div>

      {syncError && (
        <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-3">
          {syncError}
        </p>
      )}

      {syncing && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Refreshing alert history…
        </p>
      )}

      {!hasHydrated ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center text-muted-foreground">
            Loading agenda…
          </CardContent>
        </Card>
      ) : todayItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center text-muted-foreground space-y-2">
            <p>No alerts for this day.</p>
            <p className="text-xs">
              Create a playbook with conditions (e.g. Reactor Temp PV &gt; 90),
              save it, then press Refresh agenda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-[1.125rem] top-3 bottom-3 w-px bg-border" />
          <ul className="space-y-4">
            {todayItems.map((item) => (
              <li key={item.id} className="relative pl-12">
                <span
                  className={cn(
                    "absolute left-2.5 top-5 h-4 w-4 rounded-full border-2 bg-background",
                    item.status === "completed"
                      ? "border-emerald-500 bg-emerald-500/20"
                      : "border-amber-400 bg-amber-400/30 animate-pulse",
                  )}
                />
                <Card
                  className={cn(
                    item.status === "active" &&
                      "border-amber-500/40 shadow-md shadow-amber-500/10",
                    highlightId === item.id &&
                      "ring-2 ring-primary animate-pulse",
                  )}
                >
                  <CardContent className="py-4 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold tabular-nums">
                          {formatTime(item.triggeredAt)}
                        </p>
                        <p className="font-medium">{item.playbookName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.severity === "critical"
                              ? "danger"
                              : item.severity === "warning"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {item.alertTitle}
                        </Badge>
                        <Badge
                          variant={
                            item.status === "completed" ? "success" : "warning"
                          }
                          className="gap-1"
                        >
                          {item.status === "completed" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          {item.status === "completed"
                            ? "Completed"
                            : "Active"}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.alertMessage}
                    </p>
                    <p className="text-xs font-mono text-primary/80">
                      IF {item.conditionsSummary}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
