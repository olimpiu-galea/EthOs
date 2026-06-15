import { DEFAULT_COMPANY } from "./auth-constants";
import { dorDefaultFieldValues } from "./dor-template";
import { defaultReportTitle } from "./report-templates";
import {
  nextShiftBand,
  previousShiftStartMs,
  shiftBandForTime,
  shiftReportTitle,
} from "./shift-handover";
import type { LinkedAlertSnapshot, ReportDocument } from "./types";

const DEMO_REPORT_KEYS = {
  previousSho: "lakeview-demo-sho-previous",
  dorYesterday: "lakeview-demo-dor-yesterday",
  batch6418: "lakeview-demo-bpr-6418",
} as const;

function linkedAlert(
  partial: Omit<LinkedAlertSnapshot, "id"> & { id?: string },
): LinkedAlertSnapshot {
  return {
    id: partial.id ?? `demo-alert-${partial.playbookName.replace(/\s+/g, "-").toLowerCase()}`,
    playbookName: partial.playbookName,
    alertTitle: partial.alertTitle,
    alertMessage: partial.alertMessage,
    severity: partial.severity,
    teamId: partial.teamId,
    teamName: partial.teamName,
    triggeredAt: partial.triggeredAt,
    status: partial.status,
    conditionsSummary: partial.conditionsSummary,
  };
}

function buildLakeviewDemoReports(now = Date.now()): ReportDocument[] {
  const previousShiftStart = previousShiftStartMs(now);
  const previousShoAt = previousShiftStart + 11 * 60 * 60 * 1000;
  const outgoingShift = shiftBandForTime(previousShoAt);
  const incomingShift = nextShiftBand(outgoingShift);

  const previousSho: ReportDocument = {
    id: "demo-report-sho-previous",
    templateId: "shift",
    title: shiftReportTitle(previousShoAt),
    createdAt: previousShoAt,
    createdBy: "J. Henderson",
    author: "J. Henderson",
    authorRole: "supervisor",
    isDemoReport: true,
    demoReportKey: DEMO_REPORT_KEYS.previousSho,
    fields: {
      preparedBy: "J. Henderson",
      outgoingShift,
      incomingShift,
      plantStatus:
        "Full rate on Ferm A/B. Steam header stable. Batch 6418 on ferm — cooling valve trimmed to 72%.",
      shiftWalkthrough:
        "Night band quiet until 04:00 when Ferm B temp drift triggered Potential vs Temp watch. Lab 18h row posted on schedule.",
      readinessChecklist:
        "DCS alarm log reviewed · Lab samples posted · Utilities stable · Walkdown complete · No bypassed interlocks",
      alarmsSummary:
        "3 alert(s) in pack · 2 still open · 1 warning(s) open · 1 acknowledged and monitoring",
      openAlerts:
        "• [warning] Potential vs Temp — Cooling response lag (acknowledged) @ 04:12\n• [info] Financial daily checkpoint — Info (new) @ 10:00 prior day",
      pendingActions:
        "Potential vs Temp: Confirm cooling valve response · Re-check 24h sample",
      batchStatus: "6418 · Ferm B · Fermentation · 18h · 15.1% projected yield",
      prioritiesNextShift:
        "1. Close cooling loop on 6418 before noon sample\n2. Post 24h lab row\n3. Confirm alpha amylase PO ETA with procurement",
      additionalNotes: "Maintenance walkdown on agitator AM — coordinate with control room.",
      author: "J. Henderson",
    },
    linkedAlerts: [
      linkedAlert({
        playbookName: "Potential vs Temp",
        alertTitle: "Cooling response lag",
        alertMessage: "Ferm B cooling slower than setpoint — review valve and trend.",
        severity: "warning",
        teamName: "Operations",
        triggeredAt: previousShoAt - 2 * 60 * 60 * 1000,
        status: "active",
        conditionsSummary: "DCS temp vs setpoint · 18h lab",
      }),
    ],
  };

  const dorAt = new Date(now);
  dorAt.setDate(dorAt.getDate() - 1);
  dorAt.setHours(6, 15, 0, 0);

  const dorYesterday: ReportDocument = {
    id: "demo-report-dor-yesterday",
    templateId: "dor",
    title: defaultReportTitle("dor"),
    createdAt: dorAt.getTime(),
    createdBy: "M. Torres",
    author: "M. Torres",
    authorRole: "operational",
    isDemoReport: true,
    demoReportKey: DEMO_REPORT_KEYS.dorYesterday,
    fields: {
      ...dorDefaultFieldValues(),
      author: "M. Torres",
    },
    linkedAlerts: [],
  };

  const batchAt = now - 36 * 60 * 60 * 1000;

  const batch6418: ReportDocument = {
    id: "demo-report-bpr-6418",
    templateId: "batch",
    title: "BPR — Batch 6418 · Ferm B",
    createdAt: batchAt,
    createdBy: "Operational",
    author: "Operational",
    authorRole: "operational",
    isDemoReport: true,
    demoReportKey: DEMO_REPORT_KEYS.batch6418,
    fields: {
      batchId: "6418",
      fermenter: "Ferm B",
      startTime: new Date(batchAt - 18 * 60 * 60 * 1000).toISOString().slice(0, 10),
      batchNotes:
        "Fill complete · ferm active 18h. Cooling response lag noted at 18h checkpoint. Valve opened to 72%.",
      author: "Operational",
    },
    linkedAlerts: [],
  };

  return [previousSho, dorYesterday, batch6418];
}

/** Seed demo operations documents for Lakeview pitch / fresh installs */
export async function ensureLakeviewDemoReports(): Promise<void> {
  const { useSettingsStore } = await import("@/stores/settings-store");
  const { useReportsStore } = await import("@/stores/reports-store");

  if (useSettingsStore.getState().companyId !== DEFAULT_COMPANY.id) return;

  const seeded = buildLakeviewDemoReports();
  const demoKeys = new Set(
    seeded.map((d) => d.demoReportKey).filter((k): k is string => Boolean(k)),
  );

  const existing = useReportsStore.getState().documents;
  const kept = existing.filter(
    (d) => !d.demoReportKey || !demoKeys.has(d.demoReportKey),
  );

  useReportsStore.setState({
    documents: [...seeded, ...kept].sort((a, b) => b.createdAt - a.createdAt),
  });
}
