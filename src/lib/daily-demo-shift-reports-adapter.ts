import { localDateKey } from "./dcs-timeline";
import {
  dailyDemoShiftReportKey,
  dailyDemoShiftReportYear,
  type ShiftReportSlot,
} from "./daily-demo-shift-handover-rules";
import { shiftReportTitle } from "./shift-handover";

const SHIFT_SLOTS: ShiftReportSlot[] = ["day", "night"];
const SLOT_HOUR: Record<ShiftReportSlot, number> = {
  day: 6,
  night: 18,
};

export type MappedDailyDemoShiftReport = {
  dateKey: string;
  slot: ShiftReportSlot;
  demoReportKey: string;
  createdAt: number;
  title: string;
};

/** One pre-computed demo shift handover per 12h shift change */
export function mapDailyDemoShiftReportsForYear(
  year = dailyDemoShiftReportYear(),
): MappedDailyDemoShiftReport[] {
  const records: MappedDailyDemoShiftReport[] = [];
  const cursor = new Date(year, 0, 1);
  const last = new Date(year, 11, 31);

  while (cursor <= last) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const d = cursor.getDate();
    const dateKey = localDateKey(cursor);

    for (const slot of SHIFT_SLOTS) {
      const hour = SLOT_HOUR[slot];
      const createdAt = new Date(y, m, d, hour, 0, 0, 0).getTime();

      records.push({
        dateKey,
        slot,
        demoReportKey: dailyDemoShiftReportKey(dateKey, slot),
        createdAt,
        title: shiftReportTitle(createdAt),
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return records;
}
