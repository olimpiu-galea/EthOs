"use client";

import type { ReportDocument } from "./types";
import { snapshotFromAlert } from "./report-document";
import { buildDailyDemoShiftHandoverFields } from "./daily-demo-shift-handover-fields";
import {
  DAILY_DEMO_SHIFT_REPORT_PREFIX,
  dailyDemoShiftReportId,
} from "./daily-demo-shift-handover-rules";
import { mapDailyDemoShiftReportsForYear } from "./daily-demo-shift-reports-adapter";

const DEMO_AUTHOR = "J. Henderson (demo)";

function isDailyDemoShiftReport(
  doc: Pick<ReportDocument, "isDemoReport" | "demoReportKey">,
): boolean {
  return Boolean(
    doc.isDemoReport &&
      doc.demoReportKey?.startsWith(`${DAILY_DEMO_SHIFT_REPORT_PREFIX}-`),
  );
}

/** Inject or refresh one shift handover document per 12h shift change */
export async function syncDailyDemoShiftReports(): Promise<void> {
  const { useReportsStore } = await import("@/stores/reports-store");
  const { useAlertHistoryStore } = await import("@/stores/alert-history-store");

  const store = useReportsStore.getState();
  const alerts = useAlertHistoryStore.getState().items;

  const otherDocs = store.documents.filter((d) => !isDailyDemoShiftReport(d));
  const existingByKey = new Map(
    store.documents
      .filter((d) => isDailyDemoShiftReport(d) && d.demoReportKey)
      .map((d) => [d.demoReportKey!, d] as const),
  );

  const fresh: ReportDocument[] = mapDailyDemoShiftReportsForYear().map(
    (record) => {
      const prev = existingByKey.get(record.demoReportKey);
      const alert = alerts.find(
        (a) => a.mockAlertKey === `daily-demo-${record.dateKey}`,
      );

      return {
        id: prev?.id ?? dailyDemoShiftReportId(record.dateKey, record.slot),
        templateId: "shift",
        title: record.title,
        createdAt: record.createdAt,
        createdBy: DEMO_AUTHOR,
        author: DEMO_AUTHOR,
        fields: buildDailyDemoShiftHandoverFields(record.slot),
        linkedAlerts: alert ? [snapshotFromAlert(alert)] : [],
        isDemoReport: true,
        demoReportKey: record.demoReportKey,
      };
    },
  );

  useReportsStore.setState({
    documents: [...otherDocs, ...fresh].sort(
      (a, b) => b.createdAt - a.createdAt,
    ),
  });
}
