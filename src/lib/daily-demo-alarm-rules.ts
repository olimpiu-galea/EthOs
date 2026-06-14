export const DAILY_DEMO_BUILTIN_ID = "daily-shift-checkpoint";
export const DAILY_DEMO_PLAYBOOK_NAME = "Demo alarm";

/** Demo alarm is generated for every calendar day in this year */
export function dailyDemoAlarmYear(now = new Date()): number {
  return now.getFullYear();
}
