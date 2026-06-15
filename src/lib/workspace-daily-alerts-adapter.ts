import { localDateKey } from "./dcs-timeline";
import type { LakeviewWorkspaceDemo } from "./lakeview-demo-seed";
import type { MappedPotentialTempAlert } from "./potential-temp-alerts-adapter";
import { workspaceDailyAlarmYear } from "./workspace-daily-rules";

function endOfDayMs(year: number, month: number, day: number): number {
  return new Date(year, month, day, 23, 59, 59, 999).getTime();
}

const recordsCache = new Map<string, MappedPotentialTempAlert[]>();

function buildWorkspaceDailyRecords(
  demo: LakeviewWorkspaceDemo,
  year: number,
): MappedPotentialTempAlert[] {
  const records: MappedPotentialTempAlert[] = [];
  const cursor = new Date(year, 0, 1);
  const last = new Date(year, 11, 31);
  const keyPrefix = `workspace-daily-${demo.workspaceId}`;

  while (cursor <= last) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const d = cursor.getDate();
    const dateKey = localDateKey(cursor);
    const triggeredAt = new Date(
      y,
      m,
      d,
      demo.triggerHour,
      demo.triggerMinute,
      0,
      0,
    ).getTime();

    records.push({
      mockAlertKey: `${keyPrefix}-${dateKey}`,
      batchId: demo.batchContext?.batchId ?? "—",
      fermenter: demo.batchContext?.fermenter ?? "—",
      checkpointHour: 0,
      triggeredAt,
      alertTitle: demo.alertTitle,
      alertMessage: demo.alertMessage,
      conditionsSummary: demo.conditionsSummary,
      ethanolAtDrop: null,
      durationMs: Math.max(endOfDayMs(y, m, d) - triggeredAt, 60 * 60 * 1000),
      batchContext: demo.batchContext ?? {
        batchId: "—",
        fermenter: "—",
        phaseId: "ferm",
        phaseLabel: demo.teamName,
        batchAgeH: 0,
        projectedYield: "—",
        labSamples: [],
      },
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return records;
}

/** One pre-computed workspace demo alert per calendar day (cached per builtin/year). */
export function mapWorkspaceDailyAlertsForYear(
  demo: LakeviewWorkspaceDemo,
  year = workspaceDailyAlarmYear(),
): MappedPotentialTempAlert[] {
  const cacheKey = `${demo.builtinId}:${year}`;
  const cached = recordsCache.get(cacheKey);
  if (cached) return cached;

  const records = buildWorkspaceDailyRecords(demo, year);
  recordsCache.set(cacheKey, records);
  return records;
}
