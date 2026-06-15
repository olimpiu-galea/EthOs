/** Calendar year used for workspace daily mock alerts */
export function workspaceDailyAlarmYear(now = new Date()): number {
  return now.getFullYear();
}
