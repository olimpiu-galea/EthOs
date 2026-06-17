"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Lock,
  Package,
  Wrench,
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
import { cn } from "@/lib/utils";
import {
  criticalAssetRiskActions,
  dueThisWeekActions,
  LAKEVIEW_MAINTENANCE_ACTIONS,
  maintenanceActionKpis,
  overdueActions,
  type MaintenanceAction,
  type MaintenanceRisk,
  type MaintenanceStatus,
} from "@/lib/maintenance-actions-fixture";
import {
  maintenanceWatchItems,
  type MaintenanceWatchStatus,
} from "@/lib/maintenance-playbooks";
import { canSeeMaintenance } from "@/lib/role-access";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";

const RISK_BADGE: Record<
  MaintenanceRisk,
  "danger" | "warning" | "secondary" | "outline"
> = {
  critical: "danger",
  high: "warning",
  medium: "secondary",
  low: "outline",
};

const RISK_RANK: Record<MaintenanceRisk, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

const STATUS_META: Record<
  MaintenanceStatus,
  { badge: string; rank: number }
> = {
  Overdue: { badge: "border-destructive/40 bg-destructive/10 text-destructive", rank: 2 },
  Due: { badge: "border-critical/30 bg-critical-muted text-critical-foreground", rank: 1 },
  Compliant: { badge: "border-success/30 bg-success-muted text-success-foreground", rank: 0 },
};

/** Mirrors the Batches "Playbook watch" status styling */
const WATCH_STATUS_STYLES: Record<MaintenanceWatchStatus, string> = {
  clear: "border-success/30 text-success",
  watch: "border-critical/30 bg-critical-muted text-critical-foreground",
  flagged: "border-critical/40 text-critical",
};

type KpiFilterId = "overdue" | "dueThisWeek" | "critical";

type SortKey =
  | "itemId"
  | "itemName"
  | "category"
  | "area"
  | "assetName"
  | "status"
  | "riskLevel"
  | "dueDate";

type SortDir = "asc" | "desc";

const KPI_FILTERS: {
  id: KpiFilterId;
  label: string;
  tone: "danger" | "warn" | "default";
  predicate: (items: MaintenanceAction[]) => MaintenanceAction[];
  kpiKey: "overdue" | "dueThisWeek" | "criticalAssetRisks";
}[] = [
  {
    id: "overdue",
    label: "Overdue maintenance",
    tone: "danger",
    predicate: overdueActions,
    kpiKey: "overdue",
  },
  {
    id: "dueThisWeek",
    label: "Due this week",
    tone: "warn",
    predicate: dueThisWeekActions,
    kpiKey: "dueThisWeek",
  },
  {
    id: "critical",
    label: "Critical asset risks",
    tone: "danger",
    predicate: criticalAssetRiskActions,
    kpiKey: "criticalAssetRisks",
  },
];

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
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

function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey | null;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <th className="pb-3 px-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
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

function ActionDetailDialog({
  item,
  open,
  onOpenChange,
}: {
  item: MaintenanceAction | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!item) return null;

  const detailRows: { label: string; value: string }[] = [
    { label: "Plant", value: item.plantId },
    { label: "Area", value: item.area },
    { label: "Asset ID", value: item.assetId },
    { label: "Asset name", value: item.assetName },
    { label: "Maintenance type", value: item.maintenanceType },
    { label: "Status", value: item.status },
    { label: "Criticality", value: item.criticality },
    { label: "Risk level", value: item.riskLevel },
    { label: "Due date", value: formatDate(item.dueDate) },
    { label: "Last completed", value: formatDate(item.lastCompletedDate) },
    { label: "Next scheduled", value: formatDate(item.nextScheduledDate) },
    { label: "Frequency", value: item.frequency },
    { label: "Responsible team", value: item.responsibleTeam },
    { label: "Owner", value: item.owner },
    { label: "Work order ID", value: item.workOrderId ?? "—" },
    { label: "Work order status", value: item.workOrderStatus },
    { label: "Required parts", value: item.requiredParts },
    {
      label: "Part availability",
      value: item.requiredPartsAvailable ? "Available" : "Missing",
    },
    { label: "Storage location", value: item.storageLocation },
    { label: "Est. downtime impact", value: item.estimatedDowntimeImpact },
    { label: "Source system", value: item.sourceSystem },
    { label: "Source record ID", value: item.sourceRecordId },
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
            <Badge variant="outline" className={cn("text-xs", STATUS_META[item.status].badge)}>
              {item.status}
            </Badge>
            <Badge variant={RISK_BADGE[item.riskLevel]}>{item.riskLevel} risk</Badge>
            <Badge variant="outline">{item.category}</Badge>
          </div>
          <DialogTitle>{item.itemName}</DialogTitle>
          <p className="text-sm text-muted-foreground text-left">
            CMMS · {item.plantId} · {item.area} · {item.assetId} {item.assetName}
          </p>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Maintenance details
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {detailRows.map((row) => (
                <div key={row.label} className="flex flex-col">
                  <dt className="text-[10px] uppercase text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd>{row.value}</dd>
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

          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Compliance impact
            </p>
            <p className="text-muted-foreground">{item.complianceImpact}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlaybookWatchPanel({ items }: { items: MaintenanceAction[] }) {
  const watch = maintenanceWatchItems(items);

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

export function MaintenanceHub() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const domain = useSettingsStore((s) => s.domain);
  const phase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);

  const [selected, setSelected] = useState<MaintenanceAction | null>(null);
  const [activeFilter, setActiveFilter] = useState<KpiFilterId | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    if (domain !== "ethanol" || !phase2Enabled) {
      router.replace("/playbooks");
      return;
    }
    if (user && !canSeeMaintenance(user.role)) {
      router.replace("/");
    }
  }, [domain, phase2Enabled, user, router]);

  const items = LAKEVIEW_MAINTENANCE_ACTIONS;
  const kpis = useMemo(() => maintenanceActionKpis(items), [items]);

  const activeFilterConfig = KPI_FILTERS.find((f) => f.id === activeFilter);

  const visibleItems = useMemo(() => {
    const base = activeFilterConfig ? activeFilterConfig.predicate(items) : items;

    if (!sortKey) return base;

    const sorted = [...base].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "dueDate":
          cmp =
            new Date(`${a.dueDate}T00:00:00`).getTime() -
            new Date(`${b.dueDate}T00:00:00`).getTime();
          break;
        case "riskLevel":
          cmp = RISK_RANK[a.riskLevel] - RISK_RANK[b.riskLevel];
          break;
        case "status":
          cmp = STATUS_META[a.status].rank - STATUS_META[b.status].rank;
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
    setSortDir(key === "riskLevel" || key === "status" ? "desc" : "asc");
  }

  function handleKpiClick(id: KpiFilterId) {
    setActiveFilter((current) => (current === id ? null : id));
  }

  if (domain !== "ethanol" || !phase2Enabled) return null;
  if (user && !canSeeMaintenance(user.role)) return null;

  return (
    <div className="min-h-full bg-background">
      <div className="relative overflow-hidden border-b border-border bg-card">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 40%, hsl(var(--primary) / 0.12), transparent 45%), radial-gradient(circle at 90% 20%, hsl(var(--critical) / 0.08), transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 max-lg:px-4 py-8 max-lg:py-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 font-normal">
                  <Package className="h-3.5 w-3.5" />
                  Maintenance · CMMS
                </Badge>
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <Lock className="h-3 w-3" />
                  Demo · read-only
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Wrench className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
              </div>
              <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                Which parts are available, which assets depend on them, and what
                downtime risk exists if stock is missing? Spare-part coverage and
                work-order readiness — not commercial buying workflow.
              </p>
              <Button asChild variant="outline" size="sm" className="gap-2 mt-1">
                <Link href="/agenda">
                  <CalendarDays className="h-4 w-4" />
                  View maintenance alerts in Agenda
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      "border-border/60 bg-background/80 backdrop-blur-sm transition-colors hover:border-primary/40",
                      k.tone === "danger" && "border-destructive/25",
                      k.tone === "warn" && "border-critical/25",
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
                          k.tone === "warn" && "text-critical-foreground",
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

      <div className="mx-auto max-w-6xl px-6 max-lg:px-4 py-8 max-lg:py-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Maintenance actions
                  </CardTitle>
                  <CardDescription>
                    {activeFilterConfig
                      ? `Filtered by “${activeFilterConfig.label}” · showing ${visibleItems.length} of ${items.length}`
                      : `${items.length} calibration, inspection & PM actions · sortable by each data column`}
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
              <div className="overflow-x-auto max-lg:-mx-4 max-lg:px-4">
                <table className="w-full text-sm min-w-[1000px] lg:min-w-0">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <SortHeader label="Item ID" sortKey="itemId" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortHeader label="Name" sortKey="itemName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortHeader label="Category" sortKey="category" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortHeader label="Area" sortKey="area" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortHeader label="Asset" sortKey="assetName" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortHeader label="Risk" sortKey="riskLevel" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <SortHeader label="Due date" sortKey="dueDate" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
                      <th className="pb-3 px-3 font-medium text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border/40 hover:bg-muted/20"
                      >
                        <td className="py-3 px-3 font-mono text-[11px] text-primary/80 whitespace-nowrap">
                          {item.itemId}
                        </td>
                        <td className="py-3 px-3 font-medium">{item.itemName}</td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">{item.area}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-primary/80">
                            {item.assetId}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px]", STATUS_META[item.status].badge)}
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={RISK_BADGE[item.riskLevel]}
                            className="text-[10px] capitalize"
                          >
                            {item.riskLevel}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                          {formatDate(item.dueDate)}
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
                    ))}
                    {visibleItems.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-muted-foreground">
                          No maintenance actions match this filter.
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
          <Package className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            <strong className="text-foreground font-medium">
              Maintenance owns reliability and compliance actions.
            </strong>{" "}
            Purchase orders and supplier timing for required parts live on{" "}
            <Link href="/procurement" className="text-primary underline-offset-2 hover:underline">
              Procurement
            </Link>
            . Overlapping SKUs may show a work order here and a PO there — neither
            page replaces the other system of record.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 flex gap-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            <strong className="text-foreground font-medium">Demo only</strong> —
            maintenance actions, due dates, and statuses are fixture data for
            Lakeview Energy.
          </p>
        </div>
      </div>

      <ActionDetailDialog
        item={selected}
        open={selected != null}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  );
}
