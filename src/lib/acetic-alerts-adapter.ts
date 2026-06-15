import type { BatchContext, PlaybookActionItem } from "./types";
import type { MappedPotentialTempAlert } from "./potential-temp-alerts-adapter";
import { remapMockAlertTimestamp } from "./mock-alert-calendar";

export type AceticAlertRecord = {
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
      timeToLikelyInstability?: { label: string; value: string; status?: string };
    };
    immediateActions?: {
      stepNumber?: number;
      title: string;
      guidance?: string | null;
    }[];
    recoverabilityNote?: string | null;
  };
};

export type MappedAceticAlert = MappedPotentialTempAlert;

function parseFermenter(title: string): string {
  return title.match(/Ferm\s+([A-D])/i)?.[1]?.toUpperCase() ?? "—";
}

function parseCheckpointHour(description: string): number {
  const yp = description.match(/At\s+YP/i);
  if (yp) return 0;
  const m = description.match(/At\s+(\d+)h/i);
  return m ? Number(m[1]) : 0;
}

function buildAlertMessage(record: AceticAlertRecord): string {
  const lines = [record.description];
  const observed = record.context?.observedRange?.trim();
  if (observed) lines.push(`Observed: ${observed}`);
  const note = record.context?.recoverabilityNote?.trim();
  if (note) lines.push(note);
  return lines.join("\n");
}

function buildBatchContext(record: AceticAlertRecord): BatchContext {
  const checkpointHour = parseCheckpointHour(record.description);
  const summary = record.context?.summary;
  const acetic = summary?.controlMargin?.value ?? null;
  const secondary = summary?.timeToLikelyInstability?.value ?? null;
  const secondaryLabel =
    summary?.timeToLikelyInstability?.label ?? "Secondary";

  const labSamples: { label: string; value: string }[] = [];
  if (acetic != null) {
    labSamples.push({
      label: summary?.controlMargin?.label ?? "Acetic",
      value: acetic,
    });
  }
  if (secondary != null) {
    labSamples.push({ label: secondaryLabel, value: secondary });
  }

  return {
    batchId: record.batchId,
    fermenter: parseFermenter(record.title),
    phaseId: "ferm",
    phaseLabel: checkpointHour ? `${checkpointHour}h checkpoint` : "YP checkpoint",
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
  record: AceticAlertRecord,
): PlaybookActionItem[] | undefined {
  const steps = record.context?.immediateActions;
  if (!steps?.length) return undefined;
  return steps.map((s, i) => ({
    id: `mock-action-${record.id}-${s.stepNumber ?? i + 1}`,
    title: s.title,
    detail: s.guidance?.trim() || "Follow plant SOP for infection risk flags.",
  }));
}

export function mapAceticAlert(record: AceticAlertRecord): MappedAceticAlert {
  const checkpointHour = parseCheckpointHour(record.description);
  const triggeredAt = remapMockAlertTimestamp(record.interval.start);

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

export function mapAceticAlerts(records: AceticAlertRecord[]): MappedAceticAlert[] {
  return records.map(mapAceticAlert);
}
