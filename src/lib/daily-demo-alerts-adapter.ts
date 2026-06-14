import { localDateKey } from "./dcs-timeline";
import { dailyDemoAlarmYear } from "./daily-demo-alarm-rules";
import type { MappedPotentialTempAlert } from "./potential-temp-alerts-adapter";

const TRIGGER_HOUR = 8;
const TRIGGER_MINUTE = 0;

function endOfDayMs(year: number, month: number, day: number): number {
  return new Date(year, month, day, 23, 59, 59, 999).getTime();
}

/** One pre-computed demo alert per calendar day */
export function mapDailyDemoAlertsForYear(
  year = dailyDemoAlarmYear(),
): MappedPotentialTempAlert[] {
  const records: MappedPotentialTempAlert[] = [];
  const cursor = new Date(year, 0, 1);
  const last = new Date(year, 11, 31);

  while (cursor <= last) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const d = cursor.getDate();
    const dateKey = localDateKey(cursor);
    const triggeredAt = new Date(y, m, d, TRIGGER_HOUR, TRIGGER_MINUTE, 0, 0).getTime();

    records.push({
      mockAlertKey: `daily-demo-${dateKey}`,
      batchId: "6418",
      fermenter: "B",
      checkpointHour: 0,
      triggeredAt,
      alertTitle: "Demo alarm",
      alertMessage:
        "Ferm B — cooling response is slower than expected. Review the batch trajectory and confirm corrective action.",
      conditionsSummary: "Demo alert · one instance per day on the Agenda",
      ethanolAtDrop: 15.1,
      durationMs: Math.max(endOfDayMs(y, m, d) - triggeredAt, 60 * 60 * 1000),
      batchContext: {
        batchId: "6418",
        fermenter: "B",
        phaseId: "ferm",
        phaseLabel: "Fermentation",
        batchAgeH: 18,
        projectedYield: "15.1% projected",
        labSamples: [
          { label: "Fermenter temp", value: "91.4 °F" },
          { label: "Cooling valve", value: "72% open" },
          { label: "Status", value: "Review recommended" },
        ],
      },
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return records;
}
