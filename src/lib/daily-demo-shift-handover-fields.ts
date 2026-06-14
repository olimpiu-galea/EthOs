import {
  SHIFT_BAND_OPTIONS,
  type ShiftBandId,
  shiftBandLabel,
} from "./shift-handover";

const SHARED = {
  preparedBy: "J. Henderson (demo)",
  plantStatus:
    "Plant running at nameplate. Steam and NG stable. Grind rate 15.2 MBPH. No active interlocks.",
  shiftWalkthrough:
    "Demo handover pack — same content each 12h slot for walkthroughs. Ferm B cooling response monitored after morning alarm; valve opened to 78% with trend improving.",
  readinessChecklist:
    "✓ DCS alarm log reviewed\n✓ Scheduled lab samples posted\n✓ Steam / NG / power stable\n✓ Fermenter area walkdown complete\n✓ No active safety interlocks bypassed",
  alarmsSummary: "1 alert(s) in pack · 1 still open\n1 warning(s) open",
  openAlerts: "• [warning] Demo alarm — Demo alarm (new) @ 08:00",
  pendingActions:
    "• Review batch on Ferm B — Demo alarm\n• Compare live signals with lab data — Demo alarm\n• Take corrective action — Demo alarm\n• Log outcome and resolve — Demo alarm",
  batchStatus:
    "6418 · B\n18h elapsed · phase: Fermentation\n38,500 bu · 2.85 gal/bu proj.",
  prioritiesNextShift:
    "1. Continue monitoring Ferm B cooling trend\n2. Confirm lab sample post for batch 6418\n3. Resolve Demo alarm once batch is stable",
  additionalNotes:
    "Fixed demo document — one handover per 12h shift change.",
} as const;

/** Static shift handover content — outgoing/incoming band varies by 12h slot */
export function buildDailyDemoShiftHandoverFields(
  slot: ShiftBandId,
): Record<string, string> {
  const outgoingShift =
    slot === "day" ? SHIFT_BAND_OPTIONS[1] : SHIFT_BAND_OPTIONS[0];
  const incomingShift = shiftBandLabel(slot);

  return {
    ...SHARED,
    outgoingShift,
    incomingShift,
  };
}
