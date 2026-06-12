import { getActiveBatch } from "@/lib/batch-context";
import type { BatchRecord } from "@/lib/batch-fixture-data";
import { numericValue } from "@/lib/dcs-parser";
import type { DcsTag } from "@/lib/types";

/** Lakeview dry-mill planning standard (gal denatured ethanol per bushel ground) */
export const PLANT_TARGET_GAL_PER_BU = 2.85;

/** Typical DDGS co-product credit basis for margin math */
const DDGS_LB_PER_BU = 17;

export type PlantMarginBreakdown = {
  ethanolNetPricePerGal: number;
  localCornPerBu: number;
  cornCostPerGal: number;
  energyCostPerGal: number;
  ddgsCreditPerGal: number;
  contributionPerGal: number;
  deskMarginPerGal: number;
  galPerBuUsed: number;
};

export type BatchYieldImpact = {
  batchId: string;
  fermenter: string;
  phaseLabel: string;
  bushelsCharged: number;
  targetGalPerBu: number;
  projectedGalPerBu: number;
  galPerBuGap: number;
  targetEthanolGal: number;
  projectedEthanolGal: number;
  ethanolGalShortfall: number;
  deskMarginPerGal: number;
  opportunityCostUsd: number;
  beerGalAtDrop: number | null;
  note: string;
  recommendation: string;
};

function tagNum(tags: DcsTag[], id: string, fallback: number): number {
  const t = tags.find((x) => x.id === id);
  return t ? numericValue(t.value) : fallback;
}

/** Contribution margin from spot inputs; desk margin from MKT-MARGIN is used for $ impact */
export function computePlantMarginBreakdown(
  tags: DcsTag[],
): PlantMarginBreakdown {
  const cornSpot = tagNum(tags, "MKT-CORN/_.Spot", 4.82);
  const cornBasis = tagNum(tags, "MKT-BASIS/_.Corn", -0.08);
  const etohSpot = tagNum(tags, "MKT-ETOH/_.Spot", 2.14);
  const rackPremium = tagNum(tags, "MKT-RACK/_.Premium", 0.06);
  const ddgsSpot = tagNum(tags, "MKT-DDGS/_.Spot", 178);
  const energyPerGal = tagNum(tags, "MKT-ENERGY/_.Cost", 0.42);
  const deskMarginPerGal = tagNum(tags, "MKT-MARGIN/_.PerGal", 0.18);

  const localCornPerBu = cornSpot + cornBasis;
  const galPerBuUsed = PLANT_TARGET_GAL_PER_BU;
  const cornCostPerGal = localCornPerBu / galPerBuUsed;
  const ddgsCreditPerBu = (ddgsSpot / 2000) * DDGS_LB_PER_BU;
  const ddgsCreditPerGal = ddgsCreditPerBu / galPerBuUsed;
  const ethanolNetPricePerGal = etohSpot + rackPremium;
  const contributionPerGal =
    ethanolNetPricePerGal -
    cornCostPerGal -
    energyPerGal +
    ddgsCreditPerGal;

  return {
    ethanolNetPricePerGal,
    localCornPerBu,
    cornCostPerGal,
    energyCostPerGal: energyPerGal,
    ddgsCreditPerGal,
    contributionPerGal,
    deskMarginPerGal,
    galPerBuUsed,
  };
}

export function computeBatchYieldImpact(
  batch: BatchRecord,
  deskMarginPerGal: number,
): BatchYieldImpact {
  const activePhase =
    batch.phases.find((p) => p.status === "active")?.label ?? "Fermentation";

  const targetEthanolGal = batch.bushelsCharged * batch.targetGalPerBu;
  const projectedEthanolGal =
    batch.bushelsCharged * batch.projectedGalPerBu;
  const ethanolGalShortfall = Math.max(
    0,
    targetEthanolGal - projectedEthanolGal,
  );
  const galPerBuGap = batch.targetGalPerBu - batch.projectedGalPerBu;
  const opportunityCostUsd = ethanolGalShortfall * deskMarginPerGal;

  let recommendation =
    "On track — continue fermentation profile and lab cadence.";
  if (galPerBuGap > 0.12) {
    recommendation =
      "Material yield gap — review cooling, pH, and contamination before beer well drop.";
  } else if (galPerBuGap > 0.05) {
    recommendation =
      "Minor gap vs standard — tighten temp band and confirm next lab titer row.";
  }

  return {
    batchId: batch.id,
    fermenter: batch.ferm,
    phaseLabel: activePhase,
    bushelsCharged: batch.bushelsCharged,
    targetGalPerBu: batch.targetGalPerBu,
    projectedGalPerBu: batch.projectedGalPerBu,
    galPerBuGap,
    targetEthanolGal,
    projectedEthanolGal,
    ethanolGalShortfall,
    deskMarginPerGal,
    opportunityCostUsd,
    beerGalAtDrop: batch.beerGalAtDrop,
    note:
      "Ethanol gallons are equivalent at fermenter drop (beer → beer well). Product commingles in distillation tanks before denaturing and rack loadout.",
    recommendation,
  };
}

export function computeActiveBatchYieldImpact(
  tags: DcsTag[],
): BatchYieldImpact | null {
  const batch = getActiveBatch();
  if (!batch || batch.status !== "active") return null;
  const plant = computePlantMarginBreakdown(tags);
  return computeBatchYieldImpact(batch, plant.deskMarginPerGal);
}

export type TankCommercialPosition = {
  surplusGal: number;
  contractCoveragePct: number;
  inventoryDays: number;
  surplusValueAtDeskMargin: number;
  note: string;
};

export function computeTankCommercialPosition(
  tags: DcsTag[],
): TankCommercialPosition {
  const surplusGal = tagNum(tags, "MKT-SURPLUS/_.Gal", 0);
  const contractCoveragePct = tagNum(tags, "MKT-CONTRACT/_.Coverage", 0);
  const inventoryDays = tagNum(tags, "MKT-INVENTORY/_.Days", 0);
  const deskMarginPerGal = tagNum(tags, "MKT-MARGIN/_.PerGal", 0.18);

  return {
    surplusGal,
    contractCoveragePct,
    inventoryDays,
    surplusValueAtDeskMargin: surplusGal * deskMarginPerGal,
    note:
      "Surplus is denatured fuel-grade ethanol in tank after distillation — not tied to a single fermenter batch.",
  };
}
