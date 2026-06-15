import { workspaceDailyAlarmYear } from "./workspace-daily-rules";

/** Demo agenda year — matches workspace daily alerts */
export function mockAlertCalendarYear(now = new Date()): number {
  return workspaceDailyAlarmYear(now);
}

/** Keep month/day/time from fixture ISO strings but pin to the demo calendar year. */
export function remapMockAlertTimestamp(
  isoStart: string,
  targetYear = mockAlertCalendarYear(),
): number {
  const source = new Date(isoStart);
  if (!Number.isFinite(source.getTime())) return Date.now();

  return new Date(
    targetYear,
    source.getMonth(),
    source.getDate(),
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds(),
  ).getTime();
}
