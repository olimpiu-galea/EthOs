import { buildBatchContext } from "@/lib/batch-context";

import type {

  AlertAgendaItem,

  AuditEvent,

  ReportTemplateId,

  UserRole,

} from "@/lib/types";

import { defaultReportTitle, emptyFieldsForTemplate } from "@/lib/report-templates";

import { snapshotFromAlert } from "@/lib/report-document";

import { isFinanceLikeTeam, teamForId } from "@/lib/teams";

import { useSettingsStore } from "@/stores/settings-store";



export function pickTemplateForAlert(alert: AlertAgendaItem): ReportTemplateId {

  const teams = useSettingsStore.getState().teams;

  const team = teamForId(alert.teamId, teams);

  if (isFinanceLikeTeam(team)) return "financial";

  if (alert.severity === "critical") return "downtime";

  if (alert.batchContext) return "batch";

  if (alert.lifecycle === "resolved" || alert.lifecycle === "false_alarm") {

    return "postmortem";

  }

  return "dor";

}



export function buildReportFieldsFromAlert(

  alert: AlertAgendaItem,

  templateId: ReportTemplateId,

  auditEvents: AuditEvent[] = [],

): Record<string, string> {

  const fields = emptyFieldsForTemplate(templateId);

  const batch = alert.batchContext ?? buildBatchContext();

  const time = new Date(alert.triggeredAt).toLocaleString();



  switch (templateId) {

    case "downtime":

      return {

        ...fields,

        equipment: batch?.fermenter ?? "Process area",

        duration: "See alert slot",

        rootCause: `${alert.alertMessage}\n\nCondition: IF ${alert.conditionsSummary}`,

        correctiveAction: alert.actionItems.map((a) => `• ${a.title}`).join("\n"),

      };

    case "batch":

      return {

        ...fields,

        batchId: batch?.batchId ?? "",

        fermenter: batch?.fermenter ?? "",

        startTime: time,

        batchNotes: [

          `Phase: ${batch?.phaseLabel ?? "—"}`,

          `Alert: ${alert.alertMessage}`,

          batch?.labSamples.map((s) => `${s.label}: ${s.value}`).join("\n") ?? "",

        ].join("\n\n"),

      };

    case "financial":

      return {

        ...fields,

        reviewPeriod: new Date().toLocaleDateString(undefined, { month: "short", year: "numeric" }),

        surplusPosition: "See commodity feed",

        contractStatus: `Triggered by: ${alert.playbookName}`,

        recommendation: alert.alertMessage,

      };

    case "postmortem": {

      const timeline = auditEvents

        .filter((e) => e.alertId === alert.id)

        .map((e) => `${new Date(e.at).toLocaleTimeString()} — ${e.action}${e.note ? `: ${e.note}` : ""}`)

        .join("\n");

      return {

        ...fields,

        incidentTime: time,

        batchLot: batch?.batchId ?? "",

        summary: `${alert.playbookName}: ${alert.alertMessage}`,

        timeline: timeline || "No audit events recorded",

        rootCause: alert.lifecycle === "false_alarm" ? "Classified as false alarm" : "",

        correctiveActions: alert.actionItems

          .map((a) => `${alert.completedActionIds.includes(a.id) ? "✓" : "○"} ${a.title}`)

          .join("\n"),

        lessonsLearned: "",

      };

    }

    default:

      return {

        ...fields,

        openAlerts: `• ${alert.alertTitle} at ${time}`,

        batchStatus: batch

          ? `${batch.batchId} / ${batch.phaseLabel} / yield ${batch.projectedYield}`

          : "",

        shiftNotes: `${alert.playbookName} — ${alert.alertMessage}`,

      };

  }

}



export function buildReportFromAlert(

  alert: AlertAgendaItem,

  createdBy: string,

  auditEvents: AuditEvent[] = [],

  templateId?: ReportTemplateId,

  authorRole?: UserRole,

) {

  const tpl = templateId ?? pickTemplateForAlert(alert);

  const fields = buildReportFieldsFromAlert(alert, tpl, auditEvents);

  return {

    templateId: tpl,

    title: `${defaultReportTitle(tpl)} — ${alert.playbookName}`,

    createdBy,

    author: createdBy,

    authorRole,

    fields: { ...fields, author: fields.author?.trim() || createdBy },

    linkedAlerts: [snapshotFromAlert(alert)],

  };

}


