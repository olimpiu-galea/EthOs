import type { ReportTemplateId } from "./types";
import { getDorTemplateSections } from "./dor-template";
import { shiftReportTitle } from "./shift-handover";

export type ReportFieldType = "text" | "textarea" | "date";

export type ReportFieldDef = {
  id: string;
  label: string;
  placeholder?: string;
  type: ReportFieldType;
  required?: boolean;
};

export type ReportSectionDef = {
  title: string;
  description?: string;
  fields: ReportFieldDef[];
};

export type ReportTemplateDef = {
  id: ReportTemplateId;
  name: string;
  abbr: string;
  description: string;
  cadence: string;
  sections: ReportSectionDef[];
};

export const REPORT_TEMPLATES: Record<ReportTemplateId, ReportTemplateDef> = {
  dor: {
    id: "dor",
    name: "Daily Operations Report",
    abbr: "DOR",
    description:
      "End-of-day operations summary — fields aligned with DOR 01-01-25 workbook",
    cadence: "Daily · as of 6 AM",
    sections: getDorTemplateSections(),
  },
  shift: {
    id: "shift",
    name: "Shift Handover",
    abbr: "SHO",
    description: "Outgoing → incoming operator handover pack",
    cadence: "Every 12 hours · shift change",
    sections: [
      {
        title: "Shift overview",
        description: "Outgoing operator sign-off — same structure as DOR shift section",
        fields: [
          {
            id: "preparedBy",
            label: "Shift lead / prepared by",
            placeholder: "e.g. J. Henderson",
            type: "text",
            required: true,
          },
          {
            id: "outgoingShift",
            label: "Outgoing shift",
            placeholder: "e.g. Day — 06:00–18:00",
            type: "text",
            required: true,
          },
          {
            id: "incomingShift",
            label: "Incoming shift",
            placeholder: "e.g. Night — 18:00–06:00",
            type: "text",
            required: true,
          },
          {
            id: "plantStatus",
            label: "Plant status",
            placeholder: "Throughput, utilities, staffing, rate limits…",
            type: "textarea",
            required: true,
          },
          {
            id: "shiftWalkthrough",
            label: "Shift walkthrough",
            placeholder: "Key events, interventions, abnormal situations…",
            type: "textarea",
          },
          {
            id: "readinessChecklist",
            label: "Readiness checklist",
            placeholder: "Completed walkdown items…",
            type: "textarea",
          },
        ],
      },
      {
        title: "Open items",
        description: "Filled from selected agenda alerts — alarms drive open alerts list",
        fields: [
          {
            id: "alarmsSummary",
            label: "Alarms summary",
            placeholder: "Auto from selected alerts",
            type: "textarea",
          },
          {
            id: "openAlerts",
            label: "Open alerts",
            placeholder: "Linked to alarm selection",
            type: "textarea",
          },
          {
            id: "pendingActions",
            label: "Pending playbook actions",
            placeholder: "Open checklist items from alerts",
            type: "textarea",
          },
          {
            id: "batchStatus",
            label: "Active fermenter / batch",
            placeholder: "From batch workspace",
            type: "textarea",
          },
          {
            id: "prioritiesNextShift",
            label: "Priorities for incoming shift",
            placeholder: "Top 3 tasks before anything else…",
            type: "textarea",
            required: true,
          },
          {
            id: "additionalNotes",
            label: "Additional notes",
            placeholder: "Risks, holds, contacts, follow-ups…",
            type: "textarea",
          },
        ],
      },
    ],
  },
  batch: {
    id: "batch",
    name: "Batch Production Record",
    abbr: "BPR",
    description: "Per-batch lifecycle and deviation log",
    cadence: "Per batch",
    sections: [
      {
        title: "Batch identity",
        fields: [
          {
            id: "batchId",
            label: "Batch ID",
            placeholder: "e.g. FER-2026-0412",
            type: "text",
            required: true,
          },
          {
            id: "fermenter",
            label: "Fermenter / line",
            placeholder: "e.g. F2",
            type: "text",
            required: true,
          },
          {
            id: "startTime",
            label: "Start time",
            type: "date",
          },
          {
            id: "batchNotes",
            label: "Batch notes",
            placeholder: "Timeline, PV peaks, deviations…",
            type: "textarea",
            required: true,
          },
        ],
      },
    ],
  },
  quality: {
    id: "quality",
    name: "Quality & Lab Summary",
    abbr: "QLS",
    description: "Sample results and spec compliance",
    cadence: "Per sample / daily rollup",
    sections: [
      {
        title: "Lab results",
        fields: [
          {
            id: "sampleId",
            label: "Sample ID",
            placeholder: "e.g. LAB-8842",
            type: "text",
            required: true,
          },
          {
            id: "resultSummary",
            label: "Result summary",
            placeholder: "Key analytes, pass/fail…",
            type: "textarea",
            required: true,
          },
          {
            id: "complianceNotes",
            label: "Compliance notes",
            placeholder: "Spec deviations, holds, releases…",
            type: "textarea",
          },
        ],
      },
    ],
  },
  downtime: {
    id: "downtime",
    name: "Downtime & Deviation Log",
    abbr: "DDL",
    description: "Equipment events and corrective actions",
    cadence: "Per incident",
    sections: [
      {
        title: "Incident",
        fields: [
          {
            id: "equipment",
            label: "Equipment / area",
            placeholder: "e.g. AG-2201 / Cook",
            type: "text",
            required: true,
          },
          {
            id: "duration",
            label: "Duration",
            placeholder: "e.g. 45 min",
            type: "text",
            required: true,
          },
          {
            id: "rootCause",
            label: "Root cause",
            placeholder: "What failed and why…",
            type: "textarea",
            required: true,
          },
          {
            id: "correctiveAction",
            label: "Corrective action",
            placeholder: "Steps taken, follow-up required…",
            type: "textarea",
            required: true,
          },
        ],
      },
    ],
  },
  weekly: {
    id: "weekly",
    name: "Weekly KPI Pack",
    abbr: "WKP",
    description: "Production, energy, and margin trends",
    cadence: "Weekly",
    sections: [
      {
        title: "Week summary",
        fields: [
          {
            id: "weekEnding",
            label: "Week ending",
            type: "date",
            required: true,
          },
          {
            id: "yieldSummary",
            label: "Yield summary",
            placeholder: "Gal/bu, vs target…",
            type: "textarea",
            required: true,
          },
          {
            id: "energyIntensity",
            label: "Energy intensity",
            placeholder: "BTU/gal, vs prior week…",
            type: "textarea",
          },
          {
            id: "marginNotes",
            label: "Margin / surplus notes",
            placeholder: "Commodity position, sell/hold context…",
            type: "textarea",
          },
        ],
      },
    ],
  },
  postmortem: {
    id: "postmortem",
    name: "Incident Post-Mortem",
    abbr: "PMR",
    description: "Resolved alert review with audit timeline",
    cadence: "Per incident",
    sections: [
      {
        title: "Incident review",
        fields: [
          {
            id: "incidentTime",
            label: "Incident time",
            type: "text",
            required: true,
          },
          {
            id: "batchLot",
            label: "Batch / lot",
            placeholder: "e.g. LOT-2847",
            type: "text",
          },
          {
            id: "summary",
            label: "Summary",
            type: "textarea",
            required: true,
          },
          {
            id: "timeline",
            label: "Audit timeline",
            placeholder: "Lifecycle transitions and actions…",
            type: "textarea",
            required: true,
          },
          {
            id: "rootCause",
            label: "Root cause",
            type: "textarea",
          },
          {
            id: "correctiveActions",
            label: "Corrective actions",
            type: "textarea",
            required: true,
          },
          {
            id: "lessonsLearned",
            label: "Lessons learned",
            type: "textarea",
          },
        ],
      },
    ],
  },
  financial: {
    id: "financial",
    name: "Financial Margin Review",
    abbr: "FMR",
    description: "Contract coverage and surplus decisions",
    cadence: "Weekly / ad-hoc",
    sections: [
      {
        title: "Margin review",
        fields: [
          {
            id: "author",
            label: "Author",
            placeholder: "Prepared by",
            type: "text",
            required: true,
          },
          {
            id: "approvedBy",
            label: "Approved by",
            placeholder: "Supervisor sign-off",
            type: "text",
          },
          {
            id: "reviewPeriod",
            label: "Review period",
            placeholder: "e.g. Week 23 · Jun 2026",
            type: "text",
            required: true,
          },
          {
            id: "surplusPosition",
            label: "Surplus position (gal)",
            placeholder: "e.g. 128,000",
            type: "text",
            required: true,
          },
          {
            id: "contractStatus",
            label: "Contract status",
            placeholder: "Coverage %, expiries, obligations…",
            type: "textarea",
            required: true,
          },
          {
            id: "recommendation",
            label: "Recommendation",
            placeholder: "Sell spot, hold, hedge…",
            type: "textarea",
            required: true,
          },
        ],
      },
    ],
  },
};

export function getReportTemplate(id: ReportTemplateId): ReportTemplateDef {
  return REPORT_TEMPLATES[id];
}

export function emptyFieldsForTemplate(id: ReportTemplateId): Record<string, string> {
  const tpl = REPORT_TEMPLATES[id];
  const fields: Record<string, string> = {};
  for (const section of tpl.sections) {
    for (const field of section.fields) {
      fields[field.id] = "";
    }
  }
  return fields;
}

export function defaultReportTitle(id: ReportTemplateId): string {
  if (id === "shift") {
    return shiftReportTitle(Date.now());
  }
  const tpl = REPORT_TEMPLATES[id];
  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `${tpl.abbr} — ${date}`;
}

export function validateReportFields(
  id: ReportTemplateId,
  fields: Record<string, string>,
): string | null {
  const tpl = REPORT_TEMPLATES[id];
  for (const section of tpl.sections) {
    for (const field of section.fields) {
      if (field.required && !fields[field.id]?.trim()) {
        return `${field.label} is required`;
      }
    }
  }
  return null;
}
