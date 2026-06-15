"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Lock,
  Package,
  Radio,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  criticalPurchaseRisks,
  itemsBelowMinimum,
  LAKEVIEW_PROCUREMENT_ITEMS,
  openPurchaseOrders,
  procurementKpis,
  PURCHASE_ORDER_LABELS,
  stockoutBeforeLeadTime,
  supplierLeadTimeIssues,
  type ProcurementItem,
  type ProcurementRiskLevel,
} from "@/lib/procurement-fixture";
import { useInventoryStore } from "@/stores/inventory-store";

const RISK_BADGE: Record<
  ProcurementRiskLevel,
  "danger" | "warning" | "secondary" | "outline"
> = {
  critical: "danger",
  high: "warning",
  medium: "secondary",
  low: "outline",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function ProcurementRow({
  item,
  onOpen,
}: {
  item: ProcurementItem;
  onOpen: () => void;
}) {
  const belowMin = item.currentStock <= item.minimumStock;
  const stockoutRisk = item.daysOfCover < item.leadTimeDays;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full text-left rounded-lg border border-border/60 bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5",
        item.riskLevel === "critical" && "border-destructive/30 bg-destructive/5",
        item.riskLevel === "high" && !belowMin && "border-amber-500/25",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-[10px] text-primary/80">{item.itemId}</p>
          <p className="font-medium text-sm">{item.itemName}</p>
          <p className="text-[11px] text-muted-foreground">
            {item.area} · {item.plantId} · {item.supplierName}
          </p>
        </div>
        <Badge variant={RISK_BADGE[item.riskLevel]} className="text-[10px] shrink-0">
          {item.riskLevel}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          Stock{" "}
          <strong className="text-foreground tabular-nums">
            {item.currentStock.toLocaleString()} {item.unitOfMeasure}
          </strong>
        </span>
        <span>
          Cover{" "}
          <strong
            className={cn(
              "tabular-nums",
              stockoutRisk && "text-amber-500",
            )}
          >
            {item.daysOfCover}d
          </strong>
        </span>
        <span>
          Lead{" "}
          <strong className="tabular-nums">{item.leadTimeDays}d</strong>
        </span>
        {item.purchaseOrderId && (
          <span className="font-mono">{item.purchaseOrderId}</span>
        )}
      </div>
      <p className="mt-2 text-xs text-primary/90">{item.recommendedAction}</p>
    </button>
  );
}

function Section({
  title,
  description,
  items,
  onOpen,
}: {
  title: string;
  description: string;
  items: ProcurementItem[];
  onOpen: (item: ProcurementItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <ProcurementRow key={item.id} item={item} onOpen={() => onOpen(item)} />
        ))}
      </CardContent>
    </Card>
  );
}

function ItemDetailDialog({
  item,
  open,
  onOpenChange,
}: {
  item: ProcurementItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              {item.itemId}
            </Badge>
            <Badge variant={RISK_BADGE[item.riskLevel]}>{item.riskLevel} risk</Badge>
            <Badge variant="outline">{item.category}</Badge>
          </div>
          <DialogTitle>{item.itemName}</DialogTitle>
          <p className="text-sm text-muted-foreground text-left">
            ERP · {item.plantId} · {item.area} · Owner: {item.owner}
          </p>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Current stock</p>
              <p className="font-semibold tabular-nums">
                {item.currentStock.toLocaleString()} {item.unitOfMeasure}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Days of cover</p>
              <p
                className={cn(
                  "font-semibold tabular-nums",
                  item.daysOfCover < item.leadTimeDays && "text-amber-500",
                )}
              >
                {item.daysOfCover} days
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Consumption</p>
              <p className="font-semibold tabular-nums">
                {item.consumptionRate} {item.consumptionUnit}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Lead time</p>
              <p className="font-semibold tabular-nums">{item.leadTimeDays} days</p>
            </div>
          </div>

          <div className="rounded-lg border border-border/60 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Purchase workflow
            </p>
            <p>
              Status:{" "}
              <strong>{PURCHASE_ORDER_LABELS[item.purchaseOrderStatus]}</strong>
              {item.purchaseOrderId && (
                <span className="font-mono text-xs ml-2">{item.purchaseOrderId}</span>
              )}
            </p>
            <p>Supplier: {item.supplierName}</p>
            <p>
              Required by: <strong>{formatDate(item.requiredByDate)}</strong>
            </p>
            <p>
              Est. cost: {formatCurrency(item.estimatedCost)} (
              {item.lastPurchasePrice}
              {item.priceUnit})
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
              Operational impact
            </p>
            <p className="text-muted-foreground">{item.operationalImpact}</p>
            <p className="mt-2 font-medium text-primary">{item.recommendedAction}</p>
          </div>

          {item.relatedWorkOrderId && (
            <p className="text-xs text-muted-foreground">
              Justifies maintenance need:{" "}
              <span className="font-mono">{item.relatedWorkOrderId}</span> — see{" "}
              <Link href="/maintenance" className="text-primary underline-offset-2 hover:underline">
                Maintenance
              </Link>{" "}
              for spare-part coverage.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProcurementHub() {
  const feedConnected = useInventoryStore((s) => s.connected);
  const lastSync = useInventoryStore((s) => s.lastSync);
  const [selected, setSelected] = useState<ProcurementItem | null>(null);

  const items = LAKEVIEW_PROCUREMENT_ITEMS;
  const kpis = useMemo(() => procurementKpis(items), [items]);

  const sections = useMemo(
    () => ({
      critical: criticalPurchaseRisks(items),
      belowMin: itemsBelowMinimum(items),
      stockout: stockoutBeforeLeadTime(items),
      openPos: openPurchaseOrders(items),
      supplier: supplierLeadTimeIssues(items),
    }),
    [items],
  );

  const recommended = useMemo(
    () =>
      [...items]
        .filter((i) => i.riskLevel !== "low")
        .sort((a, b) => {
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          return order[a.riskLevel] - order[b.riskLevel];
        })
        .slice(0, 5),
    [items],
  );

  return (
    <div className="min-h-full bg-background">
      <div className="relative overflow-hidden border-b border-border bg-card">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 50%, hsl(var(--primary) / 0.12), transparent 45%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 font-normal">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Procurement · ERP
                </Badge>
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <Lock className="h-3 w-3" />
                  Demo · read-only
                </Badge>
                {feedConnected && (
                  <Badge variant="success" className="gap-1 text-[11px]">
                    <Radio className="h-3 w-3" />
                    Feed connected
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Procurement</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                What must we buy, by when, from whom — and what is the operational
                risk if it is late? Sourcing, purchase orders, suppliers, and lead
                times. Not spare-part storeroom coverage.
              </p>
            </div>
            {lastSync && (
              <span className="text-xs text-muted-foreground tabular-nums">
                ERP sync {new Date(lastSync).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Critical purchase risks", value: kpis.criticalRisks, tone: "danger" },
              { label: "Below minimum", value: kpis.belowMinimum, tone: "warn" },
              { label: "Stockout before lead time", value: kpis.stockoutBeforeLead, tone: "warn" },
              { label: "Open purchase orders", value: kpis.openPos, tone: "default" },
              { label: "Supplier / lead-time issues", value: kpis.supplierIssues, tone: "muted" },
            ].map((k) => (
              <Card
                key={k.label}
                className={cn(
                  "border-border/60 bg-background/80",
                  k.tone === "danger" && "border-destructive/25",
                  k.tone === "warn" && "border-amber-500/25",
                )}
              >
                <CardContent className="pt-4 pb-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">
                    {k.label}
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold tabular-nums mt-1",
                      k.tone === "danger" && "text-destructive",
                      k.tone === "warn" && "text-amber-500",
                    )}
                  >
                    {k.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <Section
          title="Critical purchase risks"
          description="High or critical operational risk — commercial ownership sits with Procurement."
          items={sections.critical}
          onOpen={setSelected}
        />
        <Section
          title="Items below minimum stock"
          description="Safety threshold breached — review reorder or expedite existing PO."
          items={sections.belowMin.filter((i) => !sections.critical.includes(i))}
          onOpen={setSelected}
        />
        <Section
          title="Stockout before supplier lead time"
          description="Forecast cover is shorter than supplier lead time."
          items={sections.stockout.filter(
            (i) => !sections.critical.includes(i) && !sections.belowMin.includes(i),
          )}
          onOpen={setSelected}
        />
        <Section
          title="Open purchase orders"
          description="Requested through shipped — track buying workflow state."
          items={sections.openPos}
          onOpen={setSelected}
        />
        <Section
          title="Supplier & long lead-time issues"
          description="Lead time ≥ 14 days with cover shorter than replenishment window."
          items={sections.supplier}
          onOpen={setSelected}
        />

        {recommended.length > 0 && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Recommended actions
              </CardTitle>
              <CardDescription>
                Next buying steps from playbook and ERP analytics (demo).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recommended.map((item) => (
                <ProcurementRow
                  key={item.id}
                  item={item}
                  onOpen={() => setSelected(item)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 flex gap-3 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            <strong className="text-foreground font-medium">Procurement owns buying.</strong>{" "}
            Spare-part availability and work-order readiness live on{" "}
            <Link href="/maintenance" className="text-primary underline-offset-2 hover:underline">
              Maintenance
            </Link>
            . Overlapping SKUs (e.g. pump seals) may reference a PO here and coverage there —
            neither page is the system of record for the other domain.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 flex gap-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            Demo fixture data for Lakeview Ethanol — connect ERP procurement feed for live PO
            and supplier sync.
          </p>
        </div>
      </div>

      <ItemDetailDialog
        item={selected}
        open={selected != null}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  );
}
