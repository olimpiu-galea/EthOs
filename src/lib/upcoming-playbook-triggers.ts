import { nextTriggerEstimate } from "./agenda-filter";
import { isMockPlaybook } from "./mock-playbook-alerts";
import type { AlertAgendaItem, Playbook } from "./types";
import { playbookCooldownMs } from "./types";

export type UpcomingPlaybookTrigger = {
  playbookId: string;
  name: string;
  at: Date;
};

export function upcomingPlaybookTriggers(
  playbooks: Playbook[],
  alertItems: AlertAgendaItem[],
  now = Date.now(),
  limit = 3,
): UpcomingPlaybookTrigger[] {
  const candidates: UpcomingPlaybookTrigger[] = [];

  for (const pb of playbooks) {
    if (pb.status !== "active") continue;

    const fromCooldown = nextTriggerEstimate(
      pb.lastTriggeredAt,
      playbookCooldownMs(pb),
    );
    if (fromCooldown && fromCooldown.getTime() > now) {
      candidates.push({ playbookId: pb.id, name: pb.name, at: fromCooldown });
    }

    if (isMockPlaybook(pb)) {
      const nextMock = alertItems
        .filter(
          (i) =>
            i.playbookId === pb.id &&
            i.isMockAlert &&
            i.triggeredAt > now,
        )
        .sort((a, b) => a.triggeredAt - b.triggeredAt)[0];

      if (nextMock) {
        candidates.push({
          playbookId: pb.id,
          name: pb.name,
          at: new Date(nextMock.triggeredAt),
        });
      }
    }
  }

  const earliestByPlaybook = new Map<string, UpcomingPlaybookTrigger>();
  for (const candidate of candidates) {
    const prev = earliestByPlaybook.get(candidate.playbookId);
    if (!prev || candidate.at.getTime() < prev.at.getTime()) {
      earliestByPlaybook.set(candidate.playbookId, candidate);
    }
  }

  return [...earliestByPlaybook.values()]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, limit);
}

export function formatUpcomingTriggerTime(at: Date, now = Date.now()): string {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTriggerDay = new Date(at);
  startOfTriggerDay.setHours(0, 0, 0, 0);
  const time = at.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (startOfTriggerDay.getTime() === startOfToday.getTime()) return time;

  const tomorrow = new Date(startOfToday);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (startOfTriggerDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow ${time}`;
  }

  return at.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
