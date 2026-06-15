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
  const latestPosted = [...b.labCheckpoints].reverse().find((c) => c.posted);

  const labSamples =
    b.status === "active" && b.dcsLive.length > 0
      ? b.dcsLive.slice(0, 3).map((sig) => ({
          label: sig.label,
          value: sig.unit ? `${sig.value} ${sig.unit}` : sig.value,
        }))
      : latestPosted
        ? [
            {
              label: `Potential @ ${String(latestPosted.checkpoint)}`,
              value: latestPosted.potential
                ? `${latestPosted.potential.toFixed(1)}%`
                : "—",
            },
            {
              label: "Temp",
              value: latestPosted.temp ? `${latestPosted.temp} °F` : "—",
            },
            {
              label: "Acetic",
              value: latestPosted.acetic?.toFixed(2) ?? "—",
            },
          ]
        : b.events
            .filter((e) => e.type === "sample")
            .slice(-3)
            .map((e) => ({ label: e.field ?? e.summary, value: e.summary }));

  const yieldKpi = b.kpis.find((k) => k.label.toLowerCase().includes("yield"));

  return {
    batchId: b.id,
    fermenter: b.fermenterLetter,
    phaseId: activePhase?.id ?? "ferm",
    phaseLabel: activePhase?.label ?? "Fermentation",
    batchAgeH: b.fermenterAgeH,
    projectedYield: yieldKpi?.value ?? `${b.projectedGalPerBu} gal/bu`,
    labSamples,
  };
}

export function batchContextForOperationalAlert(): BatchContext | undefined {
  return buildBatchContext();
}
