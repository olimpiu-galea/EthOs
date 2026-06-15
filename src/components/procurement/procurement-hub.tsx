"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  CalendarDays,
  Clock,
  Lock,
  Package,
  Radio,
  ShoppingCart,
  Truck,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
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
import {
  procurementWatchItems,
  type ProcurementWatchStatus,
} from "@/lib/procurement-playbooks";
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

const RISK_RANK: Record<ProcurementRiskLevel, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

/** Mirrors the Batches "Playbook watch" status styling */
const WATCH_STATUS_STYLES: Record<ProcurementWatchStatus, string> = {
  clear: "border-success/30 text-success",
  watch: "border-critical/30 bg-critical-muted text-critical-foreground",
  flagged: "border-critical/40 text-critical",
};

type KpiFilterId =
  | "critical"
  | "belowMin"
  | "stockout"
  | "openPos"
  | "supplier";

type SortKey =
  | "itemId"
  | "itemName"
  | "category"
  | "area"
  | "currentStock"
  | "riskLevel";

type SortDir = "asc" | "desc";

const KPI_FILTERS: {
  id: KpiFilterId;
  label: string;
  tone: "danger" | "warn" | "default" | "muted";
  predicate: (items: ProcurementItem[]) => ProcurementItem[];
  kpiKey: "criticalRisks" | "belowMinimum" | "stockoutBeforeLead" | "openPos" | "supplierIssues";
}[] = [
  {
    id: "critical",
    label: "Critical purchase risks",
    tone: "danger",
    predicate: criticalPurchaseRisks,
    kpiKey: "criticalRisks",
  },
  {
    id: "belowMin",
    label: "Below minimum",
    tone: "warn",
    predicate: itemsBelowMinimum,
    kpiKey: "belowMinimum",
  },
  {
    id: "stockout",
    label: "Stockout before lead time",
    tone: "warn",
    predicate: stockoutBeforeLeadTime,
    kpiKey: "stockoutBeforeLead",
  },
  {
    id: "openPos",
    label: "Open purchase orders",
    tone: "default",
    predicate: openPurchaseOrders,
    kpiKey: "openPos",
  },
  {
    id: "supplier",
    label: "Supplier / lead-time issues",
    tone: "muted",
    predicate: supplierLeadTimeIssues,
    kpiKey: "supplierIssues",
  },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey | null;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = activeKey === sortKey;
  return (
    <th className={cn("pb-3 px-3 font-medium", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </th>
  );
}

function ItemDetailDialog({
  item,
  open,
  onOpenChange,
  onPurchase,
}: {
  item: ProcurementItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPurchase: (item: ProcurementItem) => void;
}) {
  if (!item) return null;

  const detailRows: { label: string; value: string }[] = [
    { label: "Plant", value: item.plantId },
    { label: "Area", value: item.area },
    { label: "Unit of measure", value: item.unitOfMeasure },
    { label: "Minimum stock", value: `${item.minimumStock.toLocaleString()} ${item.unitOfMeasure}` },
    { label: "Target stock", value: `${item.targetStock.toLocaleString()} ${item.unitOfMeasure}` },
    { label: "Required by", value: formatDate(item.requiredByDate) },
    { label: "Supplier", value: item.supplierName },
    { label: "Last purchase price", value: `${formatCurrency(item.lastPurchasePrice)} ${item.priceUnit}` },
    { label: "Estimated order cost", value: formatCurrency(item.estimatedCost) },
    { label: "PO status", value: PURCHASE_ORDER_LABELS[item.purchaseOrderStatus] },
    { label: "PO ID", value: item.purchaseOrderId ?? "—" },
    { label: "Owner", value: item.owner },
    { label: "Last updated", value: formatDateTime(item.lastUpdatedAt) },
  ];

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

          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Procurement details
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {detailRows.map((row) => (
                <div key={row.label} className="flex flex-col">
                  <dt className="text-[10px] uppercase text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="tabular-nums">{row.value}</dd>
                </div>
              ))}
            </dl>
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

          <div className="flex justify-end">
            <Button className="gap-2" onClick={() => onPurchase(item)}>
              <ShoppingCart className="h-4 w-4" />
              Purchase
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlaybookWatchPanel({ items }: { items: ProcurementItem[] }) {
  const watch = procurementWatchItems(items);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        Playbook watch
      </p>
      <ul className="space-y-2">
        {watch.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2"
          >
            <span
              className={cn(
                "mt-0.5 h-2 w-2 rounded-full shrink-0",
                item.status === "clear" && "bg-success",
                item.status === "watch" && "bg-critical",
                item.status === "flagged" && "bg-destructive",
              )}
            />
            <div className="min-w-0">
              <Link
                href="/playbooks"
                className="text-sm font-medium hover:underline"
              >
                {item.name}
              </Link>
              <p className="text-xs text-muted-foreground">{item.rule}</p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 text-[9px] capitalize",
                WATCH_STATUS_STYLES[item.status],
              )}
            >
              {item.status}
            </Badge>
          </li>
        ))}
      </ul>
      <Link
        href="/agenda"
        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
      >
        <Activity className="h-3 w-3" />
        Open Agenda for active alerts
      </Link>
    </div>
  );
}

export function ProcurementHub() {
  const feedConnected = useInventoryStore((s) => s.connected);
  const lastSync = useInventoryStore((s) => s.lastSync);
  const [selected, setSelected] = useState<ProcurementItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<KpiFilterId | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const items = LAKEVIEW_PROCUREMENT_ITEMS;
  const kpis = useMemo(() => procurementKpis(items), [items]);

  const activeFilterConfig = KPI_FILTERS.find((f) => f.id === activeFilter);

  const visibleItems = useMemo(() => {
    const base = activeFilterConfig ? activeFilterConfig.predicate(items) : items;

    if (!sortKey) return base;

    const sorted = [...base].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "currentStock":
          cmp = a.currentStock - b.currentStock;
          break;
        case "riskLevel":
          cmp = RISK_RANK[a.riskLevel] - RISK_RANK[b.riskLevel];
          break;
        default:
          cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [items, activeFilterConfig, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "currentStock" || key === "riskLevel" ? "desc" : "asc");
  }

  function handleKpiClick(id: KpiFilterId) {
    setActiveFilter((current) => (current === id ? null : id));
  }

  function handlePurchase(item: ProcurementItem) {
    toast({
      title: "Purchase requested",
      description: `${item.itemName} (${item.itemId}) routed to Procurement${
        item.purchaseOrderId ? ` · ${item.purchaseOrderId}` : ""
      }.`,
      href: "/agenda",
    });
  }

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
              <Button asChild variant="outline" size="sm" className="gap-2 mt-1">
                <Link href="/agenda">
                  <CalendarDays className="h-4 w-4" />
                  View procurement alerts in Agenda
                </Link>
              </Button>
            </div>
            {lastSync && (
              <span className="text-xs text-muted-foreground tabular-nums">
                ERP sync {new Date(lastSync).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {KPI_FILTERS.map((k) => {
              const isActive = activeFilter === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => handleKpiClick(k.id)}
                  aria-pressed={isActive}
                  className="text-left"
                >
                  <Card
                    className={cn(
                      "border-border/60 bg-background/80 transition-colors hover:border-primary/40",
                      k.tone === "danger" && "border-destructive/25",
                      k.tone === "warn" && "border-amber-500/25",
                      isActive && "border-primary ring-2 ring-primary/40 bg-primary/5",
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
                        {kpis[k.kpiKey]}
                      </p>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Procurement inventory
                </CardTitle>
                <CardDescription>
                  {activeFilterConfig
                    ? `Filtered by “${activeFilterConfig.label}” · showing ${visibleItems.length} of ${items.length}`
                    : `${items.length} items · sortable by each data column`}
                </CardDescription>
              </div>
              {activeFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilter(null)}
                >
                  Clear filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <SortHeader
                      label="Item ID"
                      sortKey="itemId"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Name"
                      sortKey="itemName"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Category"
                      sortKey="category"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Area"
                      sortKey="area"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <SortHeader
                      label="Current stock"
                      sortKey="currentStock"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                    <SortHeader
                      label="Risk"
                      sortKey="riskLevel"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <th className="pb-3 px-3 font-medium text-right">Purchase</th>
                    <th className="pb-3 px-3 font-medium text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => {
                    const belowMin = item.currentStock <= item.minimumStock;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border/40 hover:bg-muted/20"
                      >
                        <td className="py-3 px-3 font-mono text-[11px] text-primary/80 whitespace-nowrap">
                          {item.itemId}
                        </td>
                        <td className="py-3 px-3 font-medium">{item.itemName}</td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {item.category}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">{item.area}</td>
                        <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                          <span className={cn(belowMin && "text-amber-500 font-medium")}>
                            {item.currentStock.toLocaleString()} {item.unitOfMeasure}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={RISK_BADGE[item.riskLevel]}
                            className="text-[10px] capitalize"
                          >
                            {item.riskLevel}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handlePurchase(item)}
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Purchase
                          </Button>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(item)}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No items match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <PlaybookWatchPanel items={items} />
        </div>

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
            Demo fixture data for Lakeview Energy — connect ERP procurement feed for live PO
            and supplier sync.
          </p>
        </div>
      </div>

      <ItemDetailDialog
        item={selected}
        open={selected != null}
        onOpenChange={(v) => !v && setSelected(null)}
        onPurchase={handlePurchase}
      />
    </div>
  );
}
