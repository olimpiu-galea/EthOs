import type { Playbook } from "./types";
import { playbookCooldownMs } from "./types";
import type { DcsTimeline } from "./dcs-timeline";
import {
  appendMinuteToBuffers,
  currentMinuteIndexForDate,
  localDateKey,
  resolveSourceTimelineDay,
  tagsAtMinute,
  timestampOnDate,
} from "./dcs-timeline";
import {
  agendaNow,
  agendaTodayKey,
  resolveAlertStatus,
} from "./agenda-time";
import type { TagBufferMap } from "./rule-evaluator";
import {
  evaluatePlaybookConditions,
  conditionsPreviewForPlaybook,
} from "./rule-evaluator";
import type { AlertAgendaItem } from "./types";
import { ALERT_DURATION_MS } from "./types";
import {
  DEFAULT_ACTION_ITEMS,
  DEFAULT_GUIDANCE,
} from "./default-playbook-response";
import { enrichAlertFromPlaybook } from "./alert-enrichment";

export type BackfillResult = {
  items: Omit<AlertAgendaItem, "id" | "status">[];
};

export function backfillPlaybookAlerts(
  playbook: Playbook,
  timeline: DcsTimeline,
  now: number = agendaNow(),
): BackfillResult {
  const sourceKey = resolveSourceTimelineDay(timeline);
  const day = timeline.days[sourceKey];
  if (!day) return { items: [] };

  const todayKey = agendaTodayKey();
  const endMinute = currentMinuteIndexForDate(todayKey, now, day.minutes);
  const items: BackfillResult["items"] = [];
  const cooldownMs = playbookCooldownMs(playbook);
  let lastFire = 0;
  let buffers: TagBufferMap = {};

  for (let m = 0; m <= endMinute; m++) {
    const ts = timestampOnDate(todayKey, m);
    const tags = tagsAtMinute(timeline, sourceKey, m);
    buffers = appendMinuteToBuffers(buffers, tags, ts);

    if (ts - lastFire < cooldownMs) continue;

    const fired = evaluatePlaybookConditions(
      playbook,
      tags,
      buffers,
      ts,
    );

    if (!fired) continue;

    lastFire = ts;
    items.push(
      enrichAlertFromPlaybook(
        {
          playbookId: playbook.id,
          playbookName: playbook.name,
          alertTitle: playbook.alert.title,
          alertMessage: playbook.alert.message,
          severity: playbook.alert.severity,
          triggeredAt: ts,
          durationMs: ALERT_DURATION_MS,
          status: "active",
          lifecycle: "new",
          conditionsSummary: conditionsPreviewForPlaybook(playbook),
          actionItems: playbook.actionItems?.length
            ? playbook.actionItems
            : DEFAULT_ACTION_ITEMS,
          guidance: playbook.guidance?.length
            ? playbook.guidance
            : DEFAULT_GUIDANCE,
          completedActionIds: [],
        },
        playbook,
      ),
    );
  }

  return { items };
}

export { resolveAlertStatus };
