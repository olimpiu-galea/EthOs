"use client";



import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  FileBarChart,
  Filter,
  Radio,
} from "lucide-react";

import {

  useAlertHistoryStore,

  filterItemsForDate,

} from "@/stores/alert-history-store";

import { syncAllPlaybooksToAgenda } from "@/lib/sync-agenda";

import { loadTimeline } from "@/lib/timeline-loader";

import {
  alertInHour,
  clampDateKey,
  formatAgendaDateLabel,
  shiftDateKey,
} from "@/lib/agenda-time";
import { localDateKey } from "@/lib/dcs-timeline";

import {

  Card,

  CardContent,

  CardDescription,

  CardHeader,

  CardTitle,

} from "@/components/ui/card";

import { AgendaDatePicker } from "@/components/agenda/agenda-date-picker";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { usePlaybookStore } from "@/stores/playbook-store";

import { useCombinedLastSync } from "@/hooks/use-all-signal-tags";

import { AlertDetailModal } from "@/components/agenda/alert-detail-modal";

import type { AlertAgendaItem } from "@/lib/types";

import { useAuthStore } from "@/stores/auth-store";

import {
  filterAgendaAsUser,
  filterAgendaForViewer,
  nextTriggerEstimate,
  type AgendaLensId,
} from "@/lib/agenda-filter";

import { agendaLensesForTeams, teamNameForId } from "@/lib/teams";
import { canSeeAllAgendaTeams } from "@/lib/auth-constants";
import { useSettingsStore } from "@/stores/settings-store";

import { filterAlertsByActivePlaybooks } from "@/lib/agenda-playbook-filter";
import { playbookCooldownMs } from "@/lib/types";
import { ShiftHandoverModal } from "@/components/agenda/shift-handover-modal";



const HOUR_START = 0;

const HOUR_END = 23;

const HOUR_ROW_HEIGHT = 56;



function formatTime(ts: number) {

  return new Date(ts).toLocaleTimeString(undefined, {

    hour: "2-digit",

    minute: "2-digit",

  });

}



function hourLabel(h: number) {

  return `${String(h).padStart(2, "0")}:00`;

}



export default function AgendaPage() {

  const user = useAuthStore((s) => s.user);

  const items = useAlertHistoryStore((s) => s.items);

  const hasHydrated = useAlertHistoryStore((s) => s._hasHydrated);

  const refreshStatuses = useAlertHistoryStore((s) => s.refreshStatuses);

  const playbooks = usePlaybookStore((s) => s.playbooks);

  const lastSync = useCombinedLastSync();

  const [highlightId, setHighlightId] = useState<string | null>(null);

  const prevCountRef = useRef(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [syncError, setSyncError] = useState<string | null>(null);

  const [selectedAlert, setSelectedAlert] = useState<AlertAgendaItem | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);

  const [agendaLens, setAgendaLens] = useState<AgendaLensId>("all");

  const [now, setNow] = useState(() => Date.now());
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [agendaDateKey, setAgendaDateKey] = useState(() => localDateKey());

  const teams = useSettingsStore((s) => s.teams);
  const agendaLenses = useMemo(
    () => agendaLensesForTeams(teams),
    [teams],
  );

  useEffect(() => {
    if (
      agendaLens !== "all" &&
      !agendaLenses.some((l) => l.id === agendaLens)
    ) {
      setAgendaLens("all");
    }
  }, [agendaLens, agendaLenses]);

  useEffect(() => {

    if (useAlertHistoryStore.persist.hasHydrated()) {

      useAlertHistoryStore.getState().setHasHydrated(true);

    }

  }, []);



  useEffect(() => {

    const t = setInterval(() => setNow(Date.now()), 30_000);

    return () => clearInterval(t);

  }, []);



  const runSync = useCallback(async () => {
    setSyncError(null);

    try {
      const timeline = await loadTimeline();

      if (!timeline) {
        setSyncError("Timeline file not found.");
        return;
      }

      await syncAllPlaybooksToAgenda();
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
    }
  }, []);



  useEffect(() => {

    if (!hasHydrated) return;

    void runSync();

  }, [hasHydrated, playbooks.length, runSync]);



  useEffect(() => {

    refreshStatuses();

    const t = setInterval(() => refreshStatuses(), 30_000);

    return () => clearInterval(t);

  }, [refreshStatuses]);



  useEffect(() => {

    if (lastSync) refreshStatuses();

  }, [lastSync, refreshStatuses]);



  const role = user?.role ?? "operational";

  const isAgendaAdmin = canSeeAllAgendaTeams(role);
  const showTeamLens = isAgendaAdmin;

  const todayKey = useMemo(() => localDateKey(new Date(now)), [now]);
  const yesterdayKey = useMemo(
    () => shiftDateKey(todayKey, -1),
    [todayKey],
  );
  const minDateKey = isAgendaAdmin ? undefined : yesterdayKey;

  const viewDateKey = useMemo(
    () => clampDateKey(agendaDateKey, minDateKey, todayKey),
    [agendaDateKey, minDateKey, todayKey],
  );

  useEffect(() => {
    const clamped = clampDateKey(agendaDateKey, minDateKey, todayKey);
    if (clamped !== agendaDateKey) setAgendaDateKey(clamped);
  }, [agendaDateKey, minDateKey, todayKey]);

  const isViewingToday = viewDateKey === todayKey;

  const viewDateLabel = useMemo(
    () => formatAgendaDateLabel(viewDateKey),
    [viewDateKey],
  );

  const dayItems = useMemo(() => {
    const dated = filterItemsForDate(items, viewDateKey);
    return filterAlertsByActivePlaybooks(dated, playbooks, viewDateKey);
  }, [items, viewDateKey, playbooks]);



  const filteredItems = useMemo(
    () =>
      filterAgendaForViewer(
        dayItems,
        user ?? { id: "", role },
        showTeamLens ? agendaLens : "all",
        teams,
      ),
    [dayItems, user, role, agendaLens, showTeamLens, teams],
  );

  const handoverAlerts = useMemo(() => {
    if (canSeeAllAgendaTeams(role)) {
      return dayItems;
    }
    if (!user) return [];
    return filterAgendaAsUser(dayItems, user, teams);
  }, [dayItems, role, user, teams]);



  const active = filteredItems.filter((i) => i.status === "active").length;

  const completed = filteredItems.filter((i) => i.status === "completed").length;



  const hours = useMemo(() => {

    const list: number[] = [];

    for (let h = HOUR_START; h <= HOUR_END; h++) list.push(h);

    return list;

  }, []);



  const nextTriggers = useMemo(() => {

    return playbooks

      .filter((p) => p.status === "active")

      .map((p) => ({

        name: p.name,

        at: nextTriggerEstimate(p.lastTriggeredAt, playbookCooldownMs(p)),

      }))

      .filter((x) => x.at && x.at.getTime() > now)

      .sort((a, b) => (a.at!.getTime() - b.at!.getTime()))

      .slice(0, 3);

  }, [playbooks, now]);



  useEffect(() => {

    if (filteredItems.length > prevCountRef.current) {

      const newest = [...filteredItems].sort(

        (a, b) => b.triggeredAt - a.triggeredAt,

      )[0];

      if (newest) {

        setHighlightId(newest.id);

        const t = setTimeout(() => setHighlightId(null), 4000);

        prevCountRef.current = filteredItems.length;

        return () => clearTimeout(t);

      }

    }

    prevCountRef.current = filteredItems.length;

  }, [filteredItems]);



  const currentHour = isViewingToday ? new Date(now).getHours() : -1;



  const scrollToFocusHour = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    let focusHour = HOUR_START;
    if (isViewingToday && currentHour >= 0) {
      focusHour = currentHour;
    } else if (filteredItems.length > 0) {
      focusHour = Math.max(
        HOUR_START,
        Math.min(HOUR_END, new Date(filteredItems[0].triggeredAt).getHours()),
      );
    }

    el.scrollTop = focusHour * HOUR_ROW_HEIGHT;
  }, [currentHour, filteredItems, isViewingToday]);



  useEffect(() => {

    if (!hasHydrated || filteredItems.length === 0) return;

    scrollToFocusHour();

  }, [hasHydrated, filteredItems.length, scrollToFocusHour]);



  useEffect(() => {

    scrollToFocusHour();

  }, [currentHour, scrollToFocusHour]);



  return (

    <div className="p-8 max-w-5xl mx-auto space-y-8">

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">

        <div className="space-y-2">

          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>

        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => setHandoverOpen(true)}
            className={cn(
              "gap-2.5 h-11 px-[1.125rem] text-[15px] font-semibold rounded-lg",
              "border border-primary/45 bg-primary/10 text-primary",
              "shadow-[0_0_28px_-10px_hsl(var(--primary)/0.45)]",
              "hover:bg-primary/15 hover:border-primary/60 hover:text-primary",
              "transition-colors duration-200",
            )}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/25">
              <FileBarChart className="h-[1.1rem] w-[1.1rem]" />
            </span>
            Shift handover
          </Button>
        </div>

      </header>



      {showTeamLens && (

        <div className="space-y-1.5">

          <div className="flex flex-wrap items-center gap-2">

            <Filter className="h-4 w-4 text-muted-foreground" />

            <span className="text-sm text-muted-foreground">Team lens:</span>

            {agendaLenses.map((lens) => (

              <button

                key={lens.id}

                type="button"

                onClick={() => setAgendaLens(lens.id)}

                className={cn(

                  "text-xs rounded-full px-3 py-1 border transition-colors",

                  agendaLens === lens.id

                    ? "border-primary bg-primary/15 text-primary"

                    : "border-border text-muted-foreground",

                )}

              >

                {lens.label}

              </button>

            ))}

          </div>

          <p className="text-[10px] text-muted-foreground">

            Preview what each role sees — same routing as their login.

          </p>

        </div>

      )}



      <Card className="border-primary/30 bg-primary/5">

        <CardHeader className="pb-3">

          <div className="flex items-center gap-3">

            <CalendarDays className="h-8 w-8 text-primary" />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <CardTitle className="text-xl shrink-0">Agenda</CardTitle>
                <AgendaDatePicker
                  value={viewDateKey}
                  todayKey={todayKey}
                  minDateKey={minDateKey}
                  limitedRange={!isAgendaAdmin}
                  onChange={setAgendaDateKey}
                />
              </div>

              <CardDescription>
                {!isViewingToday && (
                  <span className="block text-foreground/90 mb-0.5">
                    {viewDateLabel}
                  </span>
                )}
                {filteredItems.length} alerts in your view · {active} active ·{" "}
                {completed} completed · sorted by time
                {!isViewingToday && " · historical day"}
              </CardDescription>
            </div>

          </div>

        </CardHeader>

      </Card>



      {isViewingToday && nextTriggers.length > 0 && (

        <Card className="border-dashed">

          <CardContent className="py-4">

            <p className="text-sm font-medium flex items-center gap-2">

              <Clock className="h-4 w-4 text-primary" />

              Next expected triggers (if conditions stay true)

            </p>

            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">

              {nextTriggers.map((t) => (

                <li key={t.name}>

                  <strong className="text-foreground">{t.name}</strong> — est.{" "}

                  {t.at!.toLocaleTimeString()}

                </li>

              ))}

            </ul>

          </CardContent>

        </Card>

      )}



      <div

        className={cn(

          "flex flex-wrap items-center gap-2 text-sm rounded-lg border px-4 py-3",

          lastSync

            ? "border-primary/30 bg-primary/5"

            : "border-border bg-muted/20",

        )}

      >

        <Radio className="h-4 w-4 text-primary" />

        <span>

          {lastSync

            ? `Live evaluation — last signal check ${new Date(lastSync).toLocaleTimeString()}`

            : "Connect integrations for live alerts"}

        </span>

      </div>



      {syncError && (

        <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-3">

          {syncError}

        </p>

      )}



      {!hasHydrated ? (

        <Card className="border-dashed">

          <CardContent className="py-14 text-center text-muted-foreground">

            Loading agenda…

          </CardContent>

        </Card>

      ) : filteredItems.length === 0 ? (

        <Card className="border-dashed">

          <CardContent className="py-14 text-center space-y-3">

            <p className="text-muted-foreground">
              {isViewingToday
                ? "No alerts on today's timeline yet."
                : `No alerts recorded for ${viewDateLabel}.`}
            </p>

            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {!isViewingToday ? (
                isAgendaAdmin
                  ? "Connect Lab Sheet under Integrations and turn on Potential vs Temp or Acetic playbooks to load demo history for past dates."
                  : "Yesterday's alerts only — older history is available to supervisors and admins."
              ) : dayItems.length > 0 ? (
                "This team lens may be hiding alerts — try All teams or another role."
              ) : lastSync ? (
                "Active playbooks will appear here after the next signal check."
              ) : (
                "Connect DCS under Integrations and ensure at least one playbook is Active."
              )}
            </p>

          </CardContent>

        </Card>

      ) : (

        <div className="rounded-xl border overflow-hidden flex flex-col max-h-[min(70vh,calc(100vh-16rem))]">

          <div className="grid grid-cols-[72px_1fr] bg-muted/30 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">

            <div className="px-3 py-2">Hour</div>

            <div className="px-3 py-2">Alerts & slots</div>

          </div>

          <div

            ref={scrollRef}

            className="overflow-y-auto flex-1 scroll-smooth"

          >

            {hours.map((hour) => {

              const slotAlerts = filteredItems.filter((i) =>

                alertInHour(i, hour),

              );

              const isNow = isViewingToday && hour === currentHour;



              return (

                <div

                  key={hour}

                  data-hour={hour}

                  style={{ minHeight: HOUR_ROW_HEIGHT }}

                  className={cn(

                    "grid grid-cols-[72px_1fr] border-b border-border/40",

                    isNow && "bg-primary/5",

                  )}

                >

                  <div className="px-3 py-3 text-sm font-mono text-muted-foreground border-r border-border/40">

                    {hourLabel(hour)}

                    {isNow && (

                      <span className="block text-[9px] text-primary mt-0.5">

                        now

                      </span>

                    )}

                  </div>

                  <div className="px-3 py-2 flex flex-wrap gap-2 items-center">

                    {slotAlerts.length === 0 ? (

                      <span className="text-xs text-muted-foreground/50">—</span>

                    ) : (

                      slotAlerts.map((item) => (

                        <button

                          key={item.id}

                          type="button"

                          onClick={() => {

                            setSelectedAlert(item);

                            setDetailOpen(true);

                          }}

                          className={cn(

                            "text-left rounded-lg border px-3 py-2 text-xs max-w-full transition-all hover:border-primary/50",

                            item.status === "active"

                              ? "border-amber-500/40 bg-amber-500/10"

                              : "border-emerald-500/30 bg-emerald-500/5",

                            highlightId === item.id && "ring-2 ring-primary",

                          )}

                        >

                          <div className="flex items-center gap-2">

                            <span className="font-semibold tabular-nums">

                              {formatTime(item.triggeredAt)}

                            </span>

                            <Badge

                              variant="outline"

                              className="text-[9px] capitalize"

                            >

                              {teamNameForId(item.teamId, teams)}

                            </Badge>

                            <Badge

                              variant="outline"

                              className="text-[9px] capitalize"

                            >

                              {item.lifecycle ?? "new"}

                            </Badge>

                            {(item.escalationLevel ?? 0) > 0 && (
                              <Badge variant="warning" className="text-[9px]">
                                Esc L{item.escalationLevel}
                              </Badge>
                            )}

                            {item.status === "completed" ? (

                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />

                            ) : (

                              <Circle className="h-3 w-3 text-amber-400 animate-pulse" />

                            )}

                          </div>

                          <p className="font-medium mt-0.5 truncate">

                            {item.playbookName}

                          </p>

                          <p className="text-muted-foreground truncate">

                            {item.alertTitle}

                          </p>

                        </button>

                      ))

                    )}

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      )}



      <AlertDetailModal

        alert={selectedAlert}

        open={detailOpen}

        onOpenChange={setDetailOpen}

      />

      <ShiftHandoverModal
        open={handoverOpen}
        onOpenChange={setHandoverOpen}
        roleAlerts={handoverAlerts}
        preparedBy={user?.name ?? "Shift lead"}
        authorRole={user?.role}
      />
    </div>

  );

}


