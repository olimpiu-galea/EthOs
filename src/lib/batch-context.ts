import { MOCK_BATCHES, type BatchRecord } from "@/lib/batch-fixture-data";
import type { BatchContext } from "@/lib/types";

export function getActiveBatch(): BatchRecord | undefined {
  return MOCK_BATCHES.find((b) => b.status === "active");
}

export function countActiveBatches(): number {
  return MOCK_BATCHES.filter((b) => b.status === "active").length;
}

export function buildBatchContext(batch?: BatchRecord): BatchContext | undefined {
  const b = batch ?? getActiveBatch();
  if (!b) return undefined;

  const activePhase = b.phases.find((p) => p.status === "active");
  const labSamples = b.events
    .filter((e) => e.type === "sample")
    .slice(-3)
    .map((e) => ({ label: e.field ?? e.summary, value: e.summary }));

  const yieldKpi = b.kpis.find((k) => k.label.toLowerCase().includes("yield"));

  return {
    batchId: b.id,
    fermenter: b.ferm,
    phaseId: activePhase?.id ?? "ferm",
    phaseLabel: activePhase?.label ?? "Fermentation",
    batchAgeH: b.fermenterAgeH,
    projectedYield: yieldKpi?.value ?? `${b.projectedGalPerBu} gal/bu`,
    labSamples:
      labSamples.length > 0
        ? labSamples
        : [
            { label: "pH", value: b.kpis.find((k) => k.label.includes("pH"))?.value ?? "4.9" },
            { label: "Process age", value: `${b.fermenterAgeH}h` },
          ],
  };
}

export function batchContextForOperationalAlert(): BatchContext | undefined {
  return buildBatchContext();
}
