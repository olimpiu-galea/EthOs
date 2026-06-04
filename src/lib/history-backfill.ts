import type { Playbook } from "./types";
import { playbookCooldownMs } from "./types";
import type { DcsTimeline } from "./dcs-timeline";
import {
  appendMinuteToBuffers,
  currentMinuteIndex,
  localDateKey,
  minuteToMs,
  tagsAtMinute,
} from "./dcs-timeline";
import type { TagBufferMap } from "./rule-evaluator";
import { evaluateConditions, conditionsPreview } from "./rule-evaluator";
import type { AlertAgendaItem } from "./types";

export type BackfillResult = {
  items: Omit<AlertAgendaItem, "id" | "status">[];
};

export function backfillPlaybookAlerts(
  playbook: Playbook,
  timeline: DcsTimeline,
  dateKey: string = localDateKey(),
  now: number = Date.now(),
): BackfillResult {
  const day = timeline.days[dateKey];
  if (!day) return { items: [] };

  const endMinute = currentMinuteIndex(day, now);
  const items: BackfillResult["items"] = [];
  const cooldownMs = playbookCooldownMs(playbook);
  let lastFire = 0;
  let buffers: TagBufferMap = {};

  for (let m = 0; m <= endMinute; m++) {
    const ts = minuteToMs(day, m);
    const tags = tagsAtMinute(timeline, dateKey, m);
    buffers = appendMinuteToBuffers(buffers, tags, ts);

    if (ts - lastFire < cooldownMs) continue;

    const fired = evaluateConditions(
      playbook.conditions,
      playbook.matchMode,
      tags,
      buffers,
      ts,
    );

    if (!fired) continue;

    lastFire = ts;
    items.push({
      playbookId: playbook.id,
      playbookName: playbook.name,
      alertTitle: playbook.alert.title,
      alertMessage: playbook.alert.message,
      severity: playbook.alert.severity,
      triggeredAt: ts,
      conditionsSummary: conditionsPreview(
        playbook.conditions,
        playbook.matchMode,
      ),
    });
  }

  return { items };
}

export function resolveAlertStatus(
  triggeredAt: number,
  now: number = Date.now(),
): AlertAgendaItem["status"] {
  return triggeredAt < now - 60_000 ? "completed" : "active";
}
