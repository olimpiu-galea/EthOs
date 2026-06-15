"use client";

import { useMemo } from "react";
import { useAlertHistoryStore } from "@/stores/alert-history-store";
import { usePlaybookStore } from "@/stores/playbook-store";
import {
  formatUpcomingTriggerTime,
  upcomingPlaybookTriggers,
} from "@/lib/upcoming-playbook-triggers";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NextTriggerStatCardProps = {
  className?: string;
};

export function NextTriggerStatCard({ className }: NextTriggerStatCardProps) {
  const playbooks = usePlaybookStore((s) => s.playbooks);
  const alertItems = useAlertHistoryStore((s) => s.items);

  const nextTrigger = useMemo(
    () => upcomingPlaybookTriggers(playbooks, alertItems, Date.now(), 1)[0],
    [playbooks, alertItems],
  );

  const content = nextTrigger ? (
    <>
      <p className="text-2xl font-bold tabular-nums truncate">
        {formatUpcomingTriggerTime(nextTrigger.at)}
      </p>
      <p className="text-sm font-medium truncate">{nextTrigger.name}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        If conditions hold · triggers first
      </p>
    </>
  ) : (
    <>
      <p className="text-2xl font-bold tabular-nums">—</p>
      <p className="text-sm text-muted-foreground">No upcoming triggers</p>
    </>
  );

  return (
    <Card className={cn("h-full border-border bg-card shadow-sm", className)}>
      <CardContent className="pt-5 pb-4">{content}</CardContent>
    </Card>
  );
}
