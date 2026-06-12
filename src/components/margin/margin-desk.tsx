"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Info,
  Radio,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { numericValue } from "@/lib/dcs-parser";
import {
  findCommodityTag,
  formatTagValue,
  marketSignalLabel,
} from "@/lib/commodity-signals";
import {
  computeActiveBatchYieldImpact,
  computePlantMarginBreakdown,
  computeTankCommercialPosition,
  PLANT_TARGET_GAL_PER_BU,
} from "@/lib/ethanol-margin-model";
import { useCommodityStore } from "@/stores/commodity-store";
import { MarginDecisionPanel } from "@/components/margin/margin-decision-panel";

const SPARK_POINTS = 12;

function fmtUsd(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtGal(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function useSparkline(
  tagId: string,
  connected: boolean,
  lastSync: number | null,
): number[] {
  const tags = useCommodityStore((s) => s.tags);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    if (!connected) {
      setHistory([]);
      return;
    }
    const tag = findCommodityTag(tags, tagId);
    if (!tag) return;
    const v = numericValue(tag.value);
    setHistory((prev) => [...prev.slice(-(SPARK_POINTS - 1)), v]);
  }, [connected, tags, tagId, lastSync]);

  return history;
}

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) {
    return (
      <div className={cn("h-8 rounded bg-muted/40", className)} aria-hidden />
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 80;
  const h = 28;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const up = values[values.length - 1] >= values[0];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("w-20 h-7", className)} aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={up ? "text-emerald-400" : "text-amber-400"}
        points={points}
      />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  sub,
  sparkTag,
  connected,
  lastSync,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  sparkTag?: string;
  connected: boolean;
  lastSync: number | null;
  highlight?: "positive" | "warning";
}) {
  const spark = useSparkline(sparkTag ?? "", connected && !!sparkTag, lastSync);

  return (
    <Card
      className={cn(
        highlight === "positive" && "border-emerald-500/30 bg-emerald-500/5",
        highlight === "warning" && "border-amber-500/30 bg-amber-500/5",
      )}
    >
      <CardContent className="pt-5 pb-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {sparkTag && <Sparkline values={spark} />}
      </CardContent>
    </Card>
  );
}

function MarginLine({
  label,
  value,
  sign,
}: {
  label: string;
  value: string;
  sign?: "+" | "−";
}) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">
        {sign === "−" ? "−" : sign === "+" ? "+" : ""}
        {value}
      </span>
    </div>
  );
}

export function MarginDesk() {
  const connected = useCommodityStore((s) => s.connected);
  const tags = useCommodityStore((s) => s.tags);
  const lastSync = useCommodityStore((s) => s.lastSync);

  const data = useMemo(() => {
    const get = (id: string) => findCommodityTag(tags, id);
    return {
      margin: get("MKT-MARGIN/_.PerGal"),
      surplus: get("MKT-SURPLUS/_.Gal"),
      contract: get("MKT-CONTRACT/_.Coverage"),
      inventory: get("MKT-INVENTORY/_.Days"),
      marketVal: numericValue(get("MKT-MARKET/_.Signal")?.value ?? 0),
      hedgeVal: numericValue(get("MKT-HEDGE/_.Rec")?.value ?? 0),
      corn: get("MKT-CORN/_.Spot"),
      etoh: get("MKT-ETOH/_.Spot"),
      ddgs: get("MKT-DDGS/_.Spot"),
      energy: get("MKT-ENERGY/_.Cost"),
      basis: get("MKT-BASIS/_.Corn"),
      rack: get("MKT-RACK/_.Premium"),
    };
  }, [tags, lastSync]);

  const plant = useMemo(
    () => (connected ? computePlantMarginBreakdown(tags) : null),
    [connected, tags, lastSync],
  );
  const tank = useMemo(
    () => (connected ? computeTankCommercialPosition(tags) : null),
    [connected, tags, lastSync],
  );
  const batchImpact = useMemo(
    () => (connected ? computeActiveBatchYieldImpact(tags) : null),
    [connected, tags, lastSync],
  );

  const sellSignal = marketSignalLabel(data.marketVal);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-primary font-medium">
            Ethanol · Financial operations
          </p>
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Margin Desk</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Plant margin from the commodity desk feed. Fermenter batches drop beer to
            the beer well; ethanol commingles in product tanks before denaturing and rack
            loadout — dollar impact on an active fermenter is{" "}
            <strong className="text-foreground font-medium">opportunity cost</strong>,
            not invoiced revenue per batch.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={connected ? "success" : "secondary"} className="gap-1">
            <Radio className="h-3 w-3" />
            {connected ? "Commodity connected" : "Not connected"}
          </Badge>
          {lastSync && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Updated {new Date(lastSync).toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {batchImpact && batchImpact.ethanolGalShortfall > 0 && (
        <Card className="border-amber-500/35 bg-gradient-to-br from-amber-500/10 to-card/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-amber-400" />
              Active fermenter — yield opportunity cost
            </CardTitle>
            <CardDescription>
              {batchImpact.batchId} · {batchImpact.fermenter} · {batchImpact.phaseLabel}{" "}
              · {fmtGal(batchImpact.bushelsCharged)} bu charged
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Projected yield</p>
                <p className="text-xl font-bold tabular-nums">
                  {batchImpact.projectedGalPerBu.toFixed(2)} gal/bu
                </p>
                <p className="text-xs text-muted-foreground">
                  vs {batchImpact.targetGalPerBu.toFixed(2)} std
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ethanol equiv. gap</p>
                <p className="text-xl font-bold tabular-nums text-amber-300">
                  {fmtGal(batchImpact.ethanolGalShortfall)} gal
                </p>
                <p className="text-xs text-muted-foreground">at fermenter close</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Desk margin</p>
                <p className="text-xl font-bold tabular-nums">
                  ${batchImpact.deskMarginPerGal.toFixed(2)}/gal
                </p>
                <p className="text-xs text-muted-foreground">MKT-MARGIN feed</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Opportunity cost</p>
                <p className="text-xl font-bold tabular-nums text-amber-300">
                  {fmtUsd(batchImpact.opportunityCostUsd)}
                </p>
                <p className="text-xs text-muted-foreground">gal gap × desk margin</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {batchImpact.note}
            </p>
            <p className="text-sm">{batchImpact.recommendation}</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href={`/batches?batch=${batchImpact.batchId}`}>
                  View batch
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Desk margin (net)"
          value={
            data.margin ? `$${numericValue(data.margin.value).toFixed(2)}` : "—"
          }
          sub="After corn, energy, co-products — MKT-MARGIN"
          sparkTag="MKT-MARGIN/_.PerGal"
          connected={connected}
          lastSync={lastSync}
          highlight="positive"
        />
        <KpiCard
          label="Surplus in tank"
          value={tank ? fmtGal(tank.surplusGal) : "—"}
          sub={
            tank
              ? `${fmtUsd(tank.surplusValueAtDeskMargin)} @ desk margin · denatured`
              : "After contract fulfillment"
          }
          sparkTag="MKT-SURPLUS/_.Gal"
          connected={connected}
          lastSync={lastSync}
        />
        <KpiCard
          label="Contract coverage"
          value={
            data.contract
              ? `${numericValue(data.contract.value).toFixed(1)}%`
              : "—"
          }
          sub="Production under contract"
          sparkTag="MKT-CONTRACT/_.Coverage"
          connected={connected}
          lastSync={lastSync}
        />
        <KpiCard
          label="Tank days supply"
          value={
            data.inventory
              ? `${numericValue(data.inventory.value).toFixed(1)} d`
              : "—"
          }
          sub="Surplus inventory at loadout rate"
          sparkTag="MKT-INVENTORY/_.Days"
          connected={connected}
          lastSync={lastSync}
          highlight={
            data.inventory && numericValue(data.inventory.value) > 10
              ? "warning"
              : undefined
          }
        />
      </div>

      <MarginDecisionPanel />

      <div className="grid gap-4 lg:grid-cols-3">
        {plant && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Plant margin build-up</CardTitle>
              <CardDescription>
                Spot contribution at {plant.galPerBuUsed} gal/bu standard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <MarginLine
                label="Ethanol net ($/gal)"
                value={`$${plant.ethanolNetPricePerGal.toFixed(2)}`}
                sign="+"
              />
              <MarginLine
                label={`Corn (${plant.localCornPerBu.toFixed(2)}/bu ÷ ${plant.galPerBuUsed})`}
                value={`$${plant.cornCostPerGal.toFixed(2)}`}
                sign="−"
              />
              <MarginLine
                label="Energy"
                value={`$${plant.energyCostPerGal.toFixed(2)}`}
                sign="−"
              />
              <MarginLine
                label="DDGS credit"
                value={`$${plant.ddgsCreditPerGal.toFixed(2)}`}
                sign="+"
              />
              <div className="pt-2 border-t mt-2 space-y-1">
                <MarginLine
                  label="Spot contribution (calc)"
                  value={`$${plant.contributionPerGal.toFixed(2)}`}
                />
                <MarginLine
                  label="Desk margin (feed)"
                  value={`$${plant.deskMarginPerGal.toFixed(2)}`}
                />
              </div>
              <p className="text-[10px] text-muted-foreground pt-2 leading-snug">
                Desk margin includes plant fixed costs not in spot tags. Use desk margin
                for fermenter $ impact and surplus valuation.
              </p>
            </CardContent>
          </Card>
        )}

        <Card
          className={cn(
            "lg:col-span-1 border-2",
            sellSignal === "SELL"
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-primary/30 bg-primary/5",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {sellSignal === "SELL" ? (
                <TrendingUp className="h-4 w-4 text-amber-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-primary" />
              )}
              Rack loadout signal
            </CardTitle>
            <CardDescription>Denatured product in tank → rack</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <span className="text-sm text-muted-foreground">Market signal</span>
              <Badge
                variant={sellSignal === "SELL" ? "warning" : "secondary"}
                className="font-bold"
              >
                {sellSignal}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <span className="text-sm text-muted-foreground">Hedge recommendation</span>
              <Badge variant={data.hedgeVal === 1 ? "success" : "outline"}>
                {data.hedgeVal === 1 ? "ACTIVE" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {sellSignal === "SELL"
                ? "Margin and rack conditions favor evaluating spot loadout from surplus tanks."
                : "Hold tank inventory for contract windows unless days supply exceeds policy."}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Commodity inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {[data.corn, data.etoh, data.ddgs, data.energy, data.basis, data.rack]
                .filter(Boolean)
                .map((tag) => (
                  <div
                    key={tag!.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground text-xs font-mono">
                      {tag!.displayLabel}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatTagValue(tag!)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {batchImpact && (
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fermenter mass balance (active batch)</CardTitle>
            <CardDescription>
              Standard {PLANT_TARGET_GAL_PER_BU} gal denatured ethanol per bushel ground
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Bushels charged</p>
              <p className="font-semibold tabular-nums">
                {fmtGal(batchImpact.bushelsCharged)} bu
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Target ethanol equiv.</p>
              <p className="font-semibold tabular-nums">
                {fmtGal(batchImpact.targetEthanolGal)} gal
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Projected ethanol equiv.</p>
              <p className="font-semibold tabular-nums">
                {fmtGal(batchImpact.projectedEthanolGal)} gal
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Beer well (at drop)</p>
              <p className="font-semibold tabular-nums">
                {batchImpact.beerGalAtDrop
                  ? `${fmtGal(batchImpact.beerGalAtDrop)} gal beer`
                  : "Pending drop"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
