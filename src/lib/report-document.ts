import type {
  AlertAgendaItem,
  LinkedAlertSnapshot,
  ReportDocument,
  ReportTemplateId,
} from "./types";
import { getReportTemplate } from "./report-templates";
import { teamNameForId } from "./teams";
import { useSettingsStore } from "@/stores/settings-store";

export function snapshotFromAlert(alert: AlertAgendaItem): LinkedAlertSnapshot {
  const teams = useSettingsStore.getState().teams;
  return {
    id: alert.id,
    playbookName: alert.playbookName,
    alertTitle: alert.alertTitle,
    alertMessage: alert.alertMessage,
    severity: alert.severity,
    teamId: alert.teamId,
    teamName: teamNameForId(alert.teamId, teams),
    triggeredAt: alert.triggeredAt,
    status: alert.status,
    conditionsSummary: alert.conditionsSummary,
  };
}

export function normalizeReportDocument(doc: ReportDocument): ReportDocument {
  const author = doc.author?.trim() || doc.createdBy;
  const fields = {
    ...(doc.fields ?? {}),
    author: doc.fields?.author?.trim() || author,
  };

  if (doc.fields && Object.keys(doc.fields).length > 0) {
    return {
      ...doc,
      author,
      authorRole: doc.authorRole,
      linkedAlerts: doc.linkedAlerts ?? [],
      commoditySnapshot: doc.commoditySnapshot ?? [],
      fields,
    };
  }
  return {
    ...doc,
    author,
    authorRole: doc.authorRole,
    fields,
    linkedAlerts: doc.linkedAlerts ?? [],
    commoditySnapshot: doc.commoditySnapshot ?? [],
  };
}

export function isLegacyReport(doc: ReportDocument): boolean {
  return Boolean(doc.content && (!doc.fields || Object.keys(doc.fields).length === 0));
}

export function formatReportDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAlertTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fieldDisplayValue(
  templateId: ReportTemplateId,
  fieldId: string,
  value: string,
): string {
  if (!value.trim()) {
    const tpl = getReportTemplate(templateId);
    for (const section of tpl.sections) {
      const field = section.fields.find((f) => f.id === fieldId);
      if (field) return field.placeholder ?? "—";
    }
    return "—";
  }
  if (fieldId.includes("Time") || fieldId.includes("Ending") || fieldId === "startTime") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }
  return value;
}
