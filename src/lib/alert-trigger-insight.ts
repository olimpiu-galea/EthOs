import type { AlertAgendaItem, AlertSeverity } from "./types";
import { LAKEVIEW_MAINTENANCE_PARTS } from "./maintenance-parts-fixture";
import { LAKEVIEW_PROCUREMENT_ITEMS } from "./procurement-fixture";

export type AlertInsightComparison = {
  actualLabel: string;
  actualValue: string;
  actualUnit?: string;
  expectedLabel: string;
  expectedValue: string;
  expectedUnit?: string;
  /** e.g. ">=" or "<" — shown before the expected value in the sublabel */
  expectedOperator?: string;
  tone?: "critical" | "warning";
};

export type AlertInsightContext = {
  label: string;
  value: string;
  unit?: string;
  sublabel?: string;
};

export type AlertInsightChip = {
  label: string;
  value: string;
};

export type AlertTriggerInsight = {
  headline: string;
  comparison?: AlertInsightComparison;
  context?: AlertInsightContext;
  chips: AlertInsightChip[];
  rule?: string;
};

function firstMatch(text: string, pattern: RegExp): string | null {
  return text.match(pattern)?.[1] ?? null;
}

function allMatches(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(new RegExp(pattern, "gi"))].map((m) => m[1] ?? m[0]);
}

function toneForSeverity(severity: AlertSeverity): AlertInsightComparison["tone"] {
  if (severity === "critical") return "critical";
  if (severity === "warning") return "warning";
  return "warning";
}

function formatExpectedSublabel(c: AlertInsightComparison): string {
  const op = c.expectedOperator ? `${c.expectedOperator} ` : "";
  const unit = c.expectedUnit ? ` ${c.expectedUnit}` : "";
  return `${c.expectedLabel} ${op}${c.expectedValue}${unit}`;
}

function isAceticAlert(alert: AlertAgendaItem): boolean {
  return (
    /acetic/i.test(alert.playbookName) ||
    alert.mockAlertKey?.startsWith("acetic") === true
  );
}

function aceticInsight(alert: AlertAgendaItem): AlertTriggerInsight | null {
  if (!isAceticAlert(alert)) return null;

  const msg = alert.alertMessage;
  const headline = alert.alertTitle;
  const ctx = alert.batchContext;

  const aceticMatch = msg.match(/acetic\s+([\d.]+)\s*\(\s*(>=)\s*([\d.]+)\s*\)/i);
  const potentialMatch = msg.match(
    /potential\s+([\d.]+)\s*\(\s*(<)\s*([\d.]+)\s*\)/i,
  );
  const cellMatch = msg.match(
    /cell\s*count\s+([\d.]+)\s*\(\s*(<)\s*([\d.]+)\s*\)/i,
  );
  const checkpoint =
    firstMatch(msg, /At\s+(\d+h)\b/i) ??
    (/\bAt\s+YP\b/i.test(msg) ? "YP" : null);

  const aceticSample = ctx?.labSamples.find((s) => /acetic/i.test(s.label));
  const secondarySample = ctx?.labSamples.find(
    (s) => !/acetic/i.test(s.label),
  );

  const aceticActual = aceticMatch?.[1] ?? firstMatch(aceticSample?.value ?? "", /([\d.]+)/);
  const aceticThreshold = aceticMatch?.[3] ?? null;

  if (!aceticActual) return null;

  let context: AlertInsightContext | undefined;
  if (potentialMatch) {
    context = {
      label: "Actual potential",
      value: potentialMatch[1],
      sublabel: `Limit < ${potentialMatch[3]}`,
    };
  } else if (cellMatch) {
    context = {
      label: "Actual cell count",
      value: cellMatch[1],
      sublabel: `Limit < ${cellMatch[3]}`,
    };
  } else if (secondarySample) {
    const secVal = firstMatch(secondarySample.value, /([\d.]+)/);
    if (secVal) {
      const isPotential = /potential/i.test(secondarySample.label);
      context = {
        label: isPotential ? "Actual potential" : secondarySample.label,
        value: secVal,
      };
    }
  }

  if (!context && ctx) {
    context = {
      label: "Batch age",
      value: String(ctx.batchAgeH),
      unit: "h",
    };
  }

  const chips: AlertInsightChip[] = [];
  if (ctx?.batchId) chips.push({ label: "Batch", value: ctx.batchId });
  if (ctx?.fermenter) chips.push({ label: "Ferm", value: ctx.fermenter });
  if (checkpoint) chips.push({ label: "Checkpoint", value: checkpoint });
  else if (ctx?.phaseLabel) chips.push({ label: "Phase", value: ctx.phaseLabel });

  return {
    headline,
    comparison: {
      actualLabel: "Actual acetic",
      actualValue: aceticActual,
      expectedLabel: "Threshold",
      expectedValue: aceticThreshold ?? "—",
      expectedOperator: aceticThreshold ? ">=" : undefined,
      tone: toneForSeverity(alert.severity),
    },
    context,
    chips,
    rule: aceticMatch
      ? `Acetic >= ${aceticThreshold}${potentialMatch ? ` AND Potential < ${potentialMatch[3]}` : cellMatch ? ` AND Cell count < ${cellMatch[3]}` : ""}`
      : undefined,
  };
}

function stockVsMinimumInsight(
  msg: string,
  headline: string,
): AlertTriggerInsight | null {
  const m = msg.match(
    /([\d,.]+)\s*([A-Za-z%]+)?\s+available against (?:a\s+)?([\d,.]+)\s*([A-Za-z%]+)?\s+minimum/i,
  );
  if (!m) return null;
  const current = m[1].replace(/,/g, "");
  const unit = m[2] || m[4] || "";
  const minimum = m[3].replace(/,/g, "");

  return {
    headline,
    comparison: {
      actualLabel: "Actual stock",
      actualValue: current,
      actualUnit: unit,
      expectedLabel: "Minimum",
      expectedValue: minimum,
      expectedUnit: unit,
      tone: Number(current) <= Number(minimum) ? "critical" : "warning",
    },
    chips: [],
  };
}

function marginInsight(msg: string, headline: string): AlertTriggerInsight | null {
  const margin = firstMatch(msg, /Margin \$([\d.]+)\/gal/i);
  const floor = firstMatch(msg, /below \$([\d.]+)/i);
  const inventoryDays = firstMatch(msg, /inventory days supply is ([\d.]+)d/i);
  const inventoryPolicy = firstMatch(msg, /policy > ([\d.]+)d/i);

  if (!margin && !inventoryDays) return null;

  const insight: AlertTriggerInsight = { headline, chips: [] };

  if (margin && floor) {
    insight.comparison = {
      actualLabel: "Actual margin",
      actualValue: margin,
      actualUnit: "$/gal",
      expectedLabel: "Floor",
      expectedValue: floor,
      expectedUnit: "$/gal",
      tone: Number(margin) < Number(floor) ? "critical" : "warning",
    };
  }

  if (inventoryDays) {
    insight.context = {
      label: "Inventory days",
      value: inventoryDays,
      unit: "d",
    };
    if (!insight.comparison) {
      insight.comparison = {
        actualLabel: "Inventory days",
        actualValue: inventoryDays,
        actualUnit: "d",
        expectedLabel: "Policy max",
        expectedValue: inventoryPolicy ?? "12",
        expectedUnit: "d",
        tone: "warning",
      };
    }
  }

  return insight;
}

function maintenancePartInsight(
  msg: string,
  headline: string,
): AlertTriggerInsight | null {
  const partId = firstMatch(msg, /\b(SP-[A-Z0-9-]+)\b/);
  if (!partId) return null;

  const part = LAKEVIEW_MAINTENANCE_PARTS.find((p) => p.partId === partId);
  const wo = firstMatch(msg, /\b(WO-\d+)\b/i);
  const asset =
    firstMatch(msg, /\bpump\s+(P-\d+)\b/i) ??
    firstMatch(msg, /\b(P-\d+)\b/i);

  const chips: AlertInsightChip[] = [{ label: "Part", value: partId }];
  if (wo) chips.push({ label: "Work order", value: wo });
  if (asset) chips.push({ label: "Asset", value: asset });

  if (!part) {
    return {
      headline: headline || "Spare part below minimum",
      chips,
    };
  }

  return {
    headline: `${part.partName} — below minimum`,
    comparison: {
      actualLabel: "Actual stock",
      actualValue: String(part.availableStock),
      actualUnit: part.unitOfMeasure,
      expectedLabel: "Minimum",
      expectedValue: String(part.minimumStock),
      expectedUnit: part.unitOfMeasure,
      tone: part.availableStock < part.minimumStock ? "critical" : "warning",
    },
    context: {
      label: "Lead time",
      value: String(part.leadTimeDays),
      unit: "days",
    },
    chips,
  };
}

function procurementItemInsight(
  msg: string,
  headline: string,
): AlertTriggerInsight | null {
  const item = LAKEVIEW_PROCUREMENT_ITEMS.find((row) =>
    msg.toLowerCase().includes(row.itemName.toLowerCase()),
  );
  if (!item) return null;

  const pctAboveMin =
    item.minimumStock > 0
      ? Math.round(
          ((item.currentStock - item.minimumStock) / item.minimumStock) * 100,
        )
      : 0;

  return {
    headline: `${item.itemName} — near reorder threshold`,
    comparison: {
      actualLabel: "Actual stock",
      actualValue: String(item.currentStock),
      actualUnit: item.unitOfMeasure,
      expectedLabel: "Minimum",
      expectedValue: String(item.minimumStock),
      expectedUnit: item.unitOfMeasure,
      tone: pctAboveMin <= 5 ? "warning" : "warning",
    },
    context: {
      label: "Days cover",
      value: item.daysOfCover.toFixed(1),
      unit: "d",
    },
    chips: [
      { label: "Item", value: item.itemId },
      { label: "Area", value: item.area },
    ],
  };
}

function batchInsight(alert: AlertAgendaItem): AlertTriggerInsight | null {
  if (isAceticAlert(alert)) return null;

  const ctx = alert.batchContext;
  if (!ctx) return null;

  const tempSample = ctx.labSamples.find(
    (s) =>
      /temp/i.test(s.label) ||
      /°f|°c|f\b/i.test(s.value) ||
      /measured/i.test(s.label),
  );
  const limitSample = ctx.labSamples.find((s) => /limit/i.test(s.label));

  let comparison: AlertInsightComparison | undefined;
  if (tempSample) {
    const measured = firstMatch(tempSample.value, /([\d.]+)/);
    const limit = limitSample
      ? firstMatch(limitSample.value, /([\d.]+)/)
      : firstMatch(alert.alertMessage, /control limit\s+([\d.]+)/i);

    if (measured) {
      comparison = {
        actualLabel: "Actual temperature",
        actualValue: measured,
        actualUnit: "°F",
      expectedLabel: "Limit",
      expectedValue: limit ?? "—",
      expectedUnit: limit ? "°F" : undefined,
        tone:
          limit && Number(measured) > Number(limit) ? "critical" : "warning",
      };
    }
  }

  if (!comparison) {
    const ethanol = ctx.labSamples.find((s) => /ethanol/i.test(s.label));
    const val = ethanol ? firstMatch(ethanol.value, /([\d.]+)/) : null;
    if (val) {
      comparison = {
        actualLabel: "Actual ethanol",
        actualValue: val,
        actualUnit: "%",
        expectedLabel: "Target",
        expectedValue: "—",
        tone: toneForSeverity(alert.severity),
      };
    }
  }

  return {
    headline: alert.alertTitle || `Batch ${ctx.batchId} — ${ctx.phaseLabel}`,
    comparison,
    context: {
      label: "Batch age",
      value: String(ctx.batchAgeH),
      unit: "h",
    },
    chips: [
      { label: "Batch", value: ctx.batchId },
      { label: "Ferm", value: ctx.fermenter },
      { label: "Phase", value: ctx.phaseLabel },
    ],
  };
}

function financeDemoInsight(
  msg: string,
  headline: string,
): AlertTriggerInsight | null {
  if (!/margin|inventory days|weekly plan|hedge/i.test(msg)) return null;
  if (/Margin \$[\d.]+/i.test(msg)) return null;

  return {
    headline: headline || "Margin below plan with elevated inventory",
    comparison: {
      actualLabel: "Actual margin",
      actualValue: "0.09",
      actualUnit: "$/gal",
      expectedLabel: "Plan",
      expectedValue: "0.14",
      expectedUnit: "$/gal",
      tone: "critical",
    },
    context: {
      label: "Inventory days",
      value: "14.2",
      unit: "d",
    },
    chips: [{ label: "Desk", value: "Finance" }],
  };
}

function complianceDemoInsight(
  msg: string,
  headline: string,
): AlertTriggerInsight | null {
  if (!/deviation|log gap|compliance|qa/i.test(msg)) return null;
  const batch = firstMatch(msg, /\bbatch\s+(\d+)\b/i);

  return {
    headline: headline || "Documentation gap requires QA review",
    comparison: {
      actualLabel: "Actual log gap",
      actualValue: "2.4",
      actualUnit: "h",
      expectedLabel: "Allowed",
      expectedValue: "0",
      expectedUnit: "h",
      tone: "warning",
    },
    context: {
      label: "Status",
      value: "Open",
    },
    chips: batch ? [{ label: "Batch", value: batch }] : [],
  };
}

function genericInsight(alert: AlertAgendaItem): AlertTriggerInsight {
  const msg = alert.alertMessage;
  const chips: AlertInsightChip[] = [];

  for (const wo of allMatches(msg, /\b(WO-\d+)\b/g)) {
    chips.push({ label: "Work order", value: wo });
  }
  for (const part of allMatches(msg, /\b(SP-[A-Z0-9-]+)\b/g)) {
    chips.push({ label: "Part", value: part });
  }
  for (const po of allMatches(msg, /\b(PO-\d{4}-\d+)\b/gi)) {
    chips.push({ label: "PO", value: po });
  }
  for (const batch of allMatches(msg, /\bbatch\s+(\d+)\b/gi)) {
    chips.push({ label: "Batch", value: batch });
  }

  const rule =
    alert.conditionsSummary && !/demo ·/i.test(alert.conditionsSummary)
      ? alert.conditionsSummary
      : undefined;

  return {
    headline: alert.alertTitle,
    comparison: {
      actualLabel: "Alert priority",
      actualValue:
        alert.severity === "critical"
          ? "Critical"
          : alert.severity === "warning"
            ? "Warning"
            : "Info",
      expectedLabel: "Threshold",
      expectedValue: "Breached",
      tone: toneForSeverity(alert.severity),
    },
    chips,
    rule,
  };
}

export function buildAlertTriggerInsight(
  alert: AlertAgendaItem,
): AlertTriggerInsight {
  const msg = alert.alertMessage;
  const headline = alert.alertTitle;

  return (
    stockVsMinimumInsight(msg, headline) ??
    marginInsight(msg, headline) ??
    maintenancePartInsight(msg, headline) ??
    procurementItemInsight(msg, headline) ??
    financeDemoInsight(msg, headline) ??
    complianceDemoInsight(msg, headline) ??
    aceticInsight(alert) ??
    batchInsight(alert) ??
    genericInsight(alert)
  );
}

export { formatExpectedSublabel };
