"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileBarChart,
  FileText,
  Link2,
} from "lucide-react";
import type { AlertAgendaItem, AuthUser } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/auth-constants";
import { filterAgendaForViewer } from "@/lib/agenda-filter";
import { filterAlertsByActivePlaybooks } from "@/lib/agenda-playbook-filter";
import { agendaTodayKey } from "@/lib/agenda-time";
import { localDateKey } from "@/lib/dcs-timeline";
import { formatReportDate } from "@/lib/report-document";
import { currentShiftStartMs } from "@/lib/shift-handover";
import { REPORT_TEMPLATES } from "@/lib/report-templates";
import { useAlertHistoryStore, filterItemsForDate } from "@/stores/alert-history-store";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useReportsStore } from "@/stores/reports-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useCombinedLastSync } from "@/hooks/use-all-signal-tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ActiveBatchesStatCard } from "@/components/batches/active-batches-stat-card";
import { NextTriggerStatCard } from "@/components/home/next-trigger-stat-card";

const MAX_ACTIVE_ALARMS = 3;
const MAX_LATEST_REPORTS = 3;

const SEVERITY_BADGE = {
  critical: "danger" as const,
  warning: "warning" as const,
  info: "secondary" as const,
};

function formatAlertTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActiveAlarmRow({ alert }: { alert: AlertAgendaItem }) {
  return (
    <Link
      href="/agenda"
      className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-2.5 hover:border-primary/35 hover:bg-muted/20 transition-colors"
    >
      <span
        className={cn(
          "mt-0.5 h-2 w-2 rounded-full shrink-0",
          alert.severity === "critical"
            ? "bg-critical"
            : alert.severity === "warning"
              ? "bg-critical/70"
              : "bg-muted-foreground",
        )}
      />
      <span className="min-w-0 flex-1 space-y-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatAlertTime(alert.triggeredAt)}
          </span>
          <Badge variant={SEVERITY_BADGE[alert.severity]} className="text-[9px]">
            {alert.alertTitle}
          </Badge>
        </span>
        <p className="text-sm font-medium truncate">{alert.playbookName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {alert.alertMessage}
        </p>
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
    </Link>
  );
}

export function LoggedInDashboard({ user }: { user: AuthUser }) {
  const role = user.role;
  const teams = useSettingsStore((s) => s.teams);
  const companyName = useSettingsStore((s) => s.companyName);
  const items = useAlertHistoryStore((s) => s.items);
  const alertsHydrated = useAlertHistoryStore((s) => s._hasHydrated);
  const refreshStatuses = useAlertHistoryStore((s) => s.refreshStatuses);
  const playbooks = usePlaybookStore((s) => s.playbooks);
  const documents = useReportsStore((s) => s.documents);
  const reportsHydrated = useReportsStore((s) => s._hasHydrated);
  const lastSync = useCombinedLastSync();
  const todayKey = agendaTodayKey();

  useEffect(() => {
    if (useReportsStore.persist.hasHydrated()) {
      useReportsStore.getState().setHasHydrated(true);
    }
    if (useAlertHistoryStore.persist.hasHydrated()) {
      useAlertHistoryStore.getState().setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    refreshStatuses();
  }, [refreshStatuses]);

  const todayAlerts = useMemo(() => {
    const dated = filterItemsForDate(items, todayKey);
    return filterAlertsByActivePlaybooks(dated, playbooks, todayKey);
  }, [items, todayKey, playbooks]);

  const visibleAlerts = useMemo(
    () => filterAgendaForViewer(todayAlerts, user, "all", teams),
    [todayAlerts, user, teams],
  );

  const activeAlarms = useMemo(
    () =>
      [...visibleAlerts]
        .filter((a) => a.status === "active")
        .sort((a, b) => b.triggeredAt - a.triggeredAt),
    [visibleAlerts],
  );

  const latestReports = useMemo(
    () =>
      [...documents]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, MAX_LATEST_REPORTS),
    [documents],
  );

  const previousShiftHandover = useMemo(() => {
    const shiftStart = currentShiftStartMs();
    return documents
      .filter(
        (d) => d.templateId === "shift" && d.createdAt < shiftStart,
      )
      .sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [documents]);

  const greetingDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {companyName}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary/40">
            {ROLE_LABELS[role]}
          </Badge>
        </div>
        <p className="text-xl sm:text-2xl font-semibold tracking-tight">
          Good {getDayPart()}, {user.name.split(" ")[0]}
        </p>
        <p className="text-muted-foreground">{greetingDate}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <NextTriggerStatCard />
        <ActiveBatchesStatCard />
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-medium truncate">
              {lastSync
                ? new Date(lastSync).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground">Last signal check</p>
          </CardContent>
        </Card>
      </div>

      {previousShiftHandover && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
          <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Previous shift handover
              </p>
              <p className="font-medium truncate">{previousShiftHandover.title}</p>
              <p className="text-sm text-muted-foreground">
                {previousShiftHandover.fields.outgoingShift?.trim() ||
                  "Prior shift"}{" "}
                · {formatReportDate(previousShiftHandover.createdAt)}
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0 gap-2">
              <Link href={`/reports?id=${previousShiftHandover.id}`}>
                <FileBarChart className="h-4 w-4" />
                Read handover
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-critical" />
                  Active alarms
                </CardTitle>
                <CardDescription>
                  Today on your agenda — {localDateKey()}
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1">
                <Link href="/agenda">
                  View more
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            {!alertsHydrated ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Loading alerts…
              </p>
            ) : activeAlarms.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No active alerts for your teams today.
                </p>
              </div>
            ) : (
              <>
                {activeAlarms.slice(0, MAX_ACTIVE_ALARMS).map((alert) => (
                  <ActiveAlarmRow key={alert.id} alert={alert} />
                ))}
                {activeAlarms.length > MAX_ACTIVE_ALARMS && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{activeAlarms.length - MAX_ACTIVE_ALARMS} more on the agenda
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Latest reports
                </CardTitle>
                <CardDescription>Most recent operations documents</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1">
                <Link href="/reports">
                  View more
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            {!reportsHydrated ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Loading reports…
              </p>
            ) : latestReports.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center">
                <p className="text-sm text-muted-foreground">No reports yet.</p>
              </div>
            ) : (
              latestReports.map((doc) => {
                const tpl = REPORT_TEMPLATES[doc.templateId];
                return (
                  <Link
                    key={doc.id}
                    href={`/reports?id=${doc.id}`}
                    className="block rounded-lg border border-border/70 px-3 py-2.5 hover:border-primary/35 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm truncate pr-2">
                        {doc.title}
                      </p>
                      <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                        {tpl.abbr}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {doc.templateId === "shift" && doc.fields.outgoingShift?.trim()
                        ? doc.fields.outgoingShift.trim()
                        : tpl.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      <span>{formatReportDate(doc.createdAt)}</span>
                      <span>·</span>
                      <span>{doc.author || doc.createdBy}</span>
                      {doc.linkedAlerts.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Link2 className="h-3 w-3" />
                            {doc.linkedAlerts.length} alert
                            {doc.linkedAlerts.length !== 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/playbooks">
              <BookOpen className="h-4 w-4" />
              Playbooks
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/reports">
              <FileBarChart className="h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/agenda">
              <CalendarDays className="h-4 w-4" />
              Shift handover
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function getDayPart(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
