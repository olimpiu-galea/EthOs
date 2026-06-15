import { localDateKey } from "./dcs-timeline";
import type { LakeviewWorkspaceDemo } from "./lakeview-demo-seed";
import type { MappedPotentialTempAlert } from "./potential-temp-alerts-adapter";
import { workspaceDailyAlarmYear } from "./workspace-daily-rules";

function endOfDayMs(year: number, month: number, day: number): number {
  return new Date(year, month, day, 23, 59, 59, 999).getTime();
}

function buildWorkspaceDailyRecord(
  demo: LakeviewWorkspaceDemo,
  dateKey: string,
): MappedPotentialTempAlert {
  const [y, m, d] = dateKey.split("-").map(Number);
  const keyPrefix = `workspace-daily-${demo.workspaceId}`;
  const triggeredAt = new Date(
    y,
    m - 1,
    d,
    demo.triggerHour,
    demo.triggerMinute,
    0,
    0,
  ).getTime();

  return {
    mockAlertKey: `${keyPrefix}-${dateKey}`,
    batchId: demo.batchContext?.batchId ?? "—",
    fermenter: demo.batchContext?.fermenter ?? "—",
    checkpointHour: 0,
    triggeredAt,
    alertTitle: demo.alertTitle,
    alertMessage: demo.alertMessage,
    conditionsSummary: demo.conditionsSummary,
    ethanolAtDrop: null,
    durationMs: Math.max(endOfDayMs(y, m - 1, d) - triggeredAt, 60 * 60 * 1000),
    batchContext: demo.batchContext ?? {
      batchId: "—",
      fermenter: "—",
      phaseId: "ferm",
      phaseLabel: demo.teamName,
      batchAgeH: 0,
      projectedYield: "—",
      labSamples: [],
    },
  };
}

/** One workspace demo alert for a specific calendar day */
export function workspaceDailyAlertForDate(
  demo: LakeviewWorkspaceDemo,
  dateKey: string = localDateKey(),
): MappedPotentialTempAlert {
  return buildWorkspaceDailyRecord(demo, dateKey);
}

const recordsCache = new Map<string, MappedPotentialTempAlert[]>();

/** One pre-computed workspace demo alert per calendar day (cached per builtin/year). */
export function mapWorkspaceDailyAlertsForYear(
  demo: LakeviewWorkspaceDemo,
  year = workspaceDailyAlarmYear(),
): MappedPotentialTempAlert[] {
  const cacheKey = `${demo.builtinId}:${year}`;
  const cached = recordsCache.get(cacheKey);
  if (cached) return cached;

  const records: MappedPotentialTempAlert[] = [];
  const cursor = new Date(year, 0, 1);
  const last = new Date(year, 11, 31);

  while (cursor <= last) {
    records.push(buildWorkspaceDailyRecord(demo, localDateKey(cursor)));
    cursor.setDate(cursor.getDate() + 1);
  }

  recordsCache.set(cacheKey, records);
  return records;
}
