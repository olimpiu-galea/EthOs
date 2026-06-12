import type { BatchContext, PlaybookActionItem } from "./types";

export type PotentialTempAlertRecord = {
  id: string;
  interval: { start: string; end: string };
  severity: string;
  title: string;
  description: string;
  batchId: string;
  ethanolAtDrop?: number | null;
  context?: {
    observedRange?: string | null;
    summary?: {
      controlMargin?: { label: string; value: string; status?: string };
      trend?: { direction?: string; sparkline?: number[] };
      timeToLikelyInstability?: { label: string; value: string };
    };
    immediateActions?: {
      stepNumber?: number;
      title: string;
      guidance?: string | null;
    }[];
    recoverabilityNote?: string | null;
  };
};

export type MappedPotentialTempAlert = {
  mockAlertKey: string;
  batchId: string;
  fermenter: string;
  checkpointHour: number;
  triggeredAt: number;
  alertTitle: string;
  alertMessage: string;
  conditionsSummary: string;
  ethanolAtDrop: number | null;
  batchContext: BatchContext;
  actionItems?: PlaybookActionItem[];
};

function parseFermenter(title: string): string {
  return title.match(/Ferm\s+([A-D])/i)?.[1]?.toUpperCase() ?? "—";
}

function parseCheckpointHour(description: string): number {
  const m = description.match(/At\s+(\d+)h/i);
  return m ? Number(m[1]) : 0;
}

function parseMeasuredTemp(description: string): number | null {
  const m = description.match(/measured temperature\s+([\d.]+)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function parseControlLimit(description: string): string | null {
  return description.match(/control limit\s+([\d.]+)/i)?.[1] ?? null;
}

function buildAlertMessage(record: PotentialTempAlertRecord): string {
  const lines = [record.description];
  const observed = record.context?.observedRange?.trim();
  if (observed) lines.push(`Observed: ${observed}`);
  const note = record.context?.recoverabilityNote?.trim();
  if (note) lines.push(note);
  return lines.join("\n");
}

function buildBatchContext(record: PotentialTempAlertRecord): BatchContext {
  const checkpointHour = parseCheckpointHour(record.description);
  const summary = record.context?.summary;
  const measured = summary?.controlMargin?.value ?? null;
  const expected = summary?.timeToLikelyInstability?.value ?? null;
  const limit = parseControlLimit(record.description);
  const temp = parseMeasuredTemp(record.description);

  const labSamples: { label: string; value: string }[] = [];
  if (measured != null) {
    labSamples.push({
      label: summary?.controlMargin?.label ?? "Actual Temperature",
      value: measured,
    });
  }
  if (expected != null) {
    labSamples.push({
      label: summary?.timeToLikelyInstability?.label ?? "Expected Temperature",
      value: expected,
    });
  }
  if (limit != null && temp != null) {
    labSamples.push({
      label: "Control limit",
      value: `< ${limit} (measured ${temp.toFixed(2)})`,
    });
  }
  const trend = summary?.trend?.direction;
  if (trend) {
    labSamples.push({ label: "Trend", value: trend });
  }

  return {
    batchId: record.batchId,
    fermenter: parseFermenter(record.title),
    phaseId: "ferm",
    phaseLabel: checkpointHour ? `${checkpointHour}h checkpoint` : "Checkpoint",
    batchAgeH: checkpointHour,
    projectedYield:
      record.ethanolAtDrop != null && record.ethanolAtDrop > 0
        ? `${record.ethanolAtDrop.toFixed(3)}% at drop`
        : "—",
    labSamples:
      labSamples.length > 0
        ? labSamples
        : [{ label: "Checkpoint", value: record.description }],
  };
}

function actionItemsFromRecord(
  record: PotentialTempAlertRecord,
): PlaybookActionItem[] | undefined {
  const steps = record.context?.immediateActions;
  if (!steps?.length) return undefined;
  return steps.map((s, i) => ({
    id: `mock-action-${record.id}-${s.stepNumber ?? i + 1}`,
    title: s.title,
    detail: s.guidance?.trim() || "Follow plant SOP for this checkpoint.",
  }));
}

export function mapPotentialTempAlert(
  record: PotentialTempAlertRecord,
): MappedPotentialTempAlert {
  const checkpointHour = parseCheckpointHour(record.description);
  const triggeredAt = new Date(record.interval.start).getTime();

  return {
    mockAlertKey: record.id,
    batchId: record.batchId,
    fermenter: parseFermenter(record.title),
    checkpointHour,
    triggeredAt: Number.isFinite(triggeredAt) ? triggeredAt : Date.now(),
    alertTitle: record.title,
    alertMessage: buildAlertMessage(record),
    conditionsSummary: record.description,
    ethanolAtDrop:
      record.ethanolAtDrop != null && Number.isFinite(record.ethanolAtDrop)
        ? record.ethanolAtDrop
        : null,
    batchContext: buildBatchContext(record),
    actionItems: actionItemsFromRecord(record),
  };
}

export function mapPotentialTempAlerts(
  records: PotentialTempAlertRecord[],
): MappedPotentialTempAlert[] {
  return records.map(mapPotentialTempAlert);
}
