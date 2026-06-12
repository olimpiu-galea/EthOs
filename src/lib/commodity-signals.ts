import { numericValue } from "@/lib/dcs-parser";
import type { CommoditySignalSnapshot, DcsTagWithKey } from "@/lib/types";

export const MARGIN_DESK_TAGS = [
  "MKT-MARGIN/_.PerGal",
  "MKT-SURPLUS/_.Gal",
  "MKT-CONTRACT/_.Coverage",
  "MKT-INVENTORY/_.Days",
  "MKT-CORN/_.Spot",
  "MKT-ETOH/_.Spot",
  "MKT-DDGS/_.Spot",
  "MKT-MARKET/_.Signal",
  "MKT-HEDGE/_.Rec",
  "MKT-ENERGY/_.Cost",
  "MKT-BASIS/_.Corn",
  "MKT-RACK/_.Premium",
] as const;

export const FINANCIAL_REPORT_SNAPSHOT_TAGS = [
  "MKT-MARGIN/_.PerGal",
  "MKT-SURPLUS/_.Gal",
  "MKT-CONTRACT/_.Coverage",
  "MKT-INVENTORY/_.Days",
  "MKT-MARKET/_.Signal",
  "MKT-HEDGE/_.Rec",
  "MKT-ETOH/_.Spot",
  "MKT-CORN/_.Spot",
  "MKT-ENERGY/_.Cost",
] as const;

export function findCommodityTag(
  tags: DcsTagWithKey[],
  id: string,
): DcsTagWithKey | undefined {
  return tags.find((t) => t.id === id);
}

export function formatTagValue(tag: DcsTagWithKey): string {
  const v = tag.value;
  if (typeof v === "boolean") return v ? "ON" : "OFF";
  if (tag.unit) return `${v} ${tag.unit}`.trim();
  return String(v);
}

export function formatSnapshotValue(
  snapshot: CommoditySignalSnapshot,
): string {
  if (snapshot.tag.includes("Signal") || snapshot.tag.includes("Rec")) {
    return numericValue(snapshot.value) === 1 ? "ON" : "OFF";
  }
  const v = snapshot.value;
  if (typeof v === "boolean") return v ? "ON" : "OFF";
  if (snapshot.unit) return `${v} ${snapshot.unit}`.trim();
  return String(v);
}

export function buildCommoditySnapshot(
  tags: DcsTagWithKey[],
  tagIds: readonly string[] = FINANCIAL_REPORT_SNAPSHOT_TAGS,
): CommoditySignalSnapshot[] {
  const capturedAt = Date.now();
  return tagIds
    .map((id) => findCommodityTag(tags, id))
    .filter((t): t is DcsTagWithKey => t != null)
    .map((t) => ({
      tag: t.id,
      displayLabel: t.displayLabel,
      value: t.value,
      unit: t.unit,
      capturedAt,
    }));
}

export function prefillFinancialReportFields(
  tags: DcsTagWithKey[],
): Record<string, string> {
  const margin = findCommodityTag(tags, "MKT-MARGIN/_.PerGal");
  const surplus = findCommodityTag(tags, "MKT-SURPLUS/_.Gal");
  const contract = findCommodityTag(tags, "MKT-CONTRACT/_.Coverage");
  const inventory = findCommodityTag(tags, "MKT-INVENTORY/_.Days");
  const market = findCommodityTag(tags, "MKT-MARKET/_.Signal");
  const hedge = findCommodityTag(tags, "MKT-HEDGE/_.Rec");
  const etoh = findCommodityTag(tags, "MKT-ETOH/_.Spot");

  const now = new Date();
  const reviewPeriod = `Week of ${now.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;

  const surplusGal = surplus ? numericValue(surplus.value) : null;
  const marginVal = margin ? numericValue(margin.value) : null;
  const coverage = contract ? numericValue(contract.value) : null;
  const daysSupply = inventory ? numericValue(inventory.value) : null;
  const sellSignal = market ? numericValue(market.value) === 1 : false;
  const hedgeActive = hedge ? numericValue(hedge.value) === 1 : false;
  const etohSpot = etoh ? numericValue(etoh.value) : null;

  const surplusPosition =
    surplusGal != null
      ? surplusGal.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : "";

  const contractStatus = [
    coverage != null ? `Contract coverage: ${coverage}%` : null,
    daysSupply != null ? `Inventory days supply: ${daysSupply} days` : null,
    marginVal != null ? `Net margin: $${marginVal.toFixed(2)}/gal` : null,
    etohSpot != null ? `Ethanol spot: $${etohSpot.toFixed(2)}/gal` : null,
  ]
    .filter(Boolean)
    .join(". ");

  const recommendation = [
    sellSignal
      ? "Market signal: SELL spot — evaluate rack loadout."
      : "Market signal: HOLD — maintain contract fulfillment priority.",
    hedgeActive
      ? "Hedge recommendation: ACTIVE — review position with desk."
      : "Hedge recommendation: inactive.",
    marginVal != null && surplusGal != null
      ? `At $${marginVal.toFixed(2)}/gal on ${surplusGal.toLocaleString()} gal surplus, ${sellSignal ? "spot sale window is favorable." : "holding may preserve basis upside."}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    author: "",
    approvedBy: "",
    reviewPeriod,
    surplusPosition,
    contractStatus,
    recommendation,
  };
}

export function marketSignalLabel(value: number): "SELL" | "HOLD" {
  return value === 1 ? "SELL" : "HOLD";
}
