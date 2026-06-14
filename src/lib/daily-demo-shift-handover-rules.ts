export const DAILY_DEMO_SHIFT_REPORT_PREFIX = "daily-demo-shift";

export type ShiftReportSlot = "day" | "night";

/** Demo shift handovers are generated for every 12h slot in this year */
export function dailyDemoShiftReportYear(now = new Date()): number {
  return now.getFullYear();
}

export function dailyDemoShiftReportKey(
  dateKey: string,
  slot: ShiftReportSlot,
): string {
  return `${DAILY_DEMO_SHIFT_REPORT_PREFIX}-${dateKey}-${slot}`;
}

export function dailyDemoShiftReportId(
  dateKey: string,
  slot: ShiftReportSlot,
): string {
  return `demo-shift-${dateKey}-${slot}`;
}
