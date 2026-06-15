"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Cylinder,
  Fan,
  Gauge,
  GitBranch,
  Lock,
  Search,
  ShieldAlert,
  Thermometer,
  Wrench,
  Workflow,
  Zap,
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  LAKEVIEW_MAINTENANCE_ASSETS,
  MAINTENANCE_CATEGORY_LABELS,
  maintenanceKpis,
  type AssetComplianceStatus,
  type MaintenanceAsset,
  type MaintenanceAssetCategory,
} from "@/lib/maintenance-asset-fixture";
import { canSeeMaintenance } from "@/lib/role-access";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";

const STATUS_META: Record<
  AssetComplianceStatus,
  { label: string; badge: string; dot: string }
> = {
  compliant: {
    label: "Compliant",
    badge: "border-success/30 bg-success-muted text-success-foreground",
    dot: "bg-success",
  },
  due_soon: {
    label: "Due soon",
    badge: "border-critical/30 bg-critical-muted text-critical-foreground",
    dot: "bg-critical",
  },
  overdue: {
    label: "Overdue",
    badge: "border-destructive/40 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  out_of_service: {
    label: "Out of service",
    badge: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

const CATEGORY_ICONS: Record<MaintenanceAssetCategory, typeof Gauge> = {
  sensors: Gauge,
  valves: GitBranch,
  tanks: Cylinder,
  piping: Workflow,
  pumps: Fan,
  heat_exchangers: Thermometer,
  electrical: Zap,
  safety: ShieldAlert,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function FieldRow({
  label,
  value,
  mono,
  warn,
}: {
  label: string;
  value: string;
  mono?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border/40 last:border-0 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={cn(
          "text-right font-medium",
          mono && "font-mono text-xs",
          warn && "text-critical-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function AssetCard({
  asset,
  onOpen,
}: {
  asset: MaintenanceAsset;
  onOpen: () => void;
}) {
  const status = STATUS_META[asset.status];
  const Icon = CATEGORY_ICONS[asset.category];
  const nextDate =
    asset.calibration?.nextDue ??
    asset.verification.nextDue ??
    asset.pm.nextDue;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-md",
        asset.status === "overdue" && "border-destructive/30",
        asset.status === "due_soon" && "border-critical/25",
        asset.status === "out_of_service" && "opacity-75",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] text-primary/80">{asset.assetTag}</p>
            <p className="font-semibold text-sm truncate">{asset.name}</p>
          </div>
        </div>
        <span className={cn("h-2 w-2 rounded-full shrink-0 mt-1", status.dot)} />
      </div>
      <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
        {asset.location}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant="outline" className="text-[9px]">
          {MAINTENANCE_CATEGORY_LABELS[asset.category]}
        </Badge>
        <Badge variant="outline" className={cn("text-[9px]", status.badge)}>
          {status.label}
        </Badge>
        <Badge variant="outline" className="text-[9px]">
          Crit {asset.criticality}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          Next: {formatDate(nextDate)}
        </span>
        <ChevronRight className="h-3.5 w-3.5" />
      </div>
    </button>
  );
}

function AssetDetailDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: MaintenanceAsset | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!asset) return null;
  const status = STATUS_META[asset.status];
  const Icon = CATEGORY_ICONS[asset.category];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono text-xs">
              {asset.assetTag}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", status.badge)}>
              {status.label}
            </Badge>
          </div>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Icon className="h-5 w-5 text-primary" />
            {asset.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-left">
            {asset.location} · {asset.area}
          </p>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm">Identification</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <FieldRow label="Manufacturer" value={asset.manufacturer} />
              <FieldRow label="Model" value={asset.model} mono />
              <FieldRow label="Serial" value={asset.serialNumber} mono />
              <FieldRow label="Installed" value={formatDate(asset.installDate)} />
              <FieldRow label="Owner" value={asset.owner} />
              <FieldRow label="Criticality" value={`Class ${asset.criticality}`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm">Warranty</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <FieldRow label="Vendor" value={asset.warranty.vendor} />
              <FieldRow
                label="Type"
                value={asset.warranty.type.replace("_", " ")}
              />
              <FieldRow label="Start" value={formatDate(asset.warranty.start)} />
              <FieldRow
                label="Expires"
                value={formatDate(asset.warranty.end)}
                warn={asset.status === "due_soon"}
              />
            </CardContent>
          </Card>

          {asset.calibration && (
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm">Calibration</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <FieldRow label="Provider" value={asset.calibration.provider} />
                <FieldRow
                  label="Certificate"
                  value={asset.calibration.certNumber}
                  mono
                />
                <FieldRow label="Tolerance" value={asset.calibration.tolerance} />
                <FieldRow label="Interval" value={asset.calibration.interval} />
                <FieldRow
                  label="Last cal"
                  value={formatDate(asset.calibration.lastDate)}
                />
                <FieldRow
                  label="Next due"
                  value={formatDate(asset.calibration.nextDue)}
                  warn={
                    asset.status === "due_soon" || asset.status === "overdue"
                  }
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm">Verification & inspection</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <FieldRow label="Verification method" value={asset.verification.method} />
              <FieldRow
                label="Last verification"
                value={formatDate(asset.verification.lastDate)}
              />
              <FieldRow
                label="Verification due"
                value={formatDate(asset.verification.nextDue)}
                warn={asset.status === "overdue"}
              />
              <FieldRow label="Inspection type" value={asset.inspection.type} />
              <FieldRow
                label="Inspection due"
                value={formatDate(asset.inspection.nextDue)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm">Preventive maintenance</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <FieldRow label="PM interval" value={asset.pm.interval} />
              <FieldRow label="Last PM" value={formatDate(asset.pm.lastDate)} />
              <FieldRow label="Next PM" value={formatDate(asset.pm.nextDue)} />
            </CardContent>
          </Card>

          {(asset.licenseExpiry || asset.notes) && (
            <Card className="sm:col-span-2">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm">Additional</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                {asset.licenseExpiry && (
                  <FieldRow
                    label="License / subscription expiry"
                    value={formatDate(asset.licenseExpiry)}
                    warn
                  />
                )}
                {asset.notes && (
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                    {asset.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" disabled className="gap-2">
            <Lock className="h-3.5 w-3.5" />
            Demo view — work orders coming soon
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MaintenanceHub() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const domain = useSettingsStore((s) => s.domain);
  const phase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);

  const [category, setCategory] = useState<MaintenanceAssetCategory | "all">(
    "all",
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MaintenanceAsset | null>(null);

  useEffect(() => {
    if (domain !== "ethanol" || !phase2Enabled) {
      router.replace("/playbooks");
      return;
    }
    if (user && !canSeeMaintenance(user.role)) {
      router.replace("/");
    }
  }, [domain, phase2Enabled, user, router]);

  const kpis = useMemo(
    () => maintenanceKpis(LAKEVIEW_MAINTENANCE_ASSETS),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LAKEVIEW_MAINTENANCE_ASSETS.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (!q) return true;
      return (
        a.assetTag.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.manufacturer.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  if (domain !== "ethanol" || !phase2Enabled) return null;
  if (user && !canSeeMaintenance(user.role)) return null;

  const categories = Object.entries(MAINTENANCE_CATEGORY_LABELS) as [
    MaintenanceAssetCategory,
    string,
  ][];

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
        <div className="relative mx-auto max-w-6xl px-6 py-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5 font-normal">
                  <Wrench className="h-3.5 w-3.5" />
                  Plant maintenance
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
                Asset registry for sensors, valves, tanks, piping, and rotating
                equipment — warranty, calibration, verification, and PM dates in
                one CMMS-style view.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Registered assets", value: kpis.total, tone: "default" },
              { label: "Overdue", value: kpis.overdue, tone: "danger" },
              { label: "Due soon", value: kpis.dueSoon, tone: "warn" },
              { label: "Out of service", value: kpis.outOfService, tone: "muted" },
              {
                label: "Warranty ≤ 90d",
                value: kpis.warrantyExpiring,
                tone: "warn",
              },
            ].map((k) => (
              <Card
                key={k.label}
                className={cn(
                  "border-border/60 bg-background/80 backdrop-blur-sm",
                  k.tone === "danger" && "border-destructive/25",
                  k.tone === "warn" && "border-critical/25",
                )}
              >
                <CardContent className="pt-4 pb-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold tabular-nums mt-1",
                      k.tone === "danger" && "text-destructive",
                      k.tone === "warn" && "text-critical-foreground",
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
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tag, name, location…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {filtered.length} asset{filtered.length === 1 ? "" : "s"} shown
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === "all"
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30",
            )}
          >
            All categories
          </button>
          {categories.map(([id, label]) => {
            const Icon = CATEGORY_ICONS[id];
            const count = LAKEVIEW_MAINTENANCE_ASSETS.filter(
              (a) => a.category === id,
            ).length;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
                  category === id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30",
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              No assets match this filter.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onOpen={() => setSelected(asset)}
              />
            ))}
          </div>
        )}

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              CMMS fields in this demo
            </CardTitle>
            <CardDescription>
              Based on common industrial asset management practice — not connected
              to live work orders yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs text-muted-foreground">
              {[
                "Asset tag & serial number",
                "Warranty start / end & vendor",
                "Calibration cert & tolerance",
                "Verification & inspection due",
                "PM interval & next due",
                "License / subscription expiry",
                "Criticality class A/B/C",
                "Physical verification method",
                "Owner & plant area",
              ].map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 flex gap-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            <strong className="text-foreground font-medium">Demo only</strong> —
            dates and statuses are fixture data for Lakeview Ethanol. Connect a
            CMMS feed in a future release to sync work orders and certificates.
          </p>
        </div>
      </div>

      <AssetDetailDialog
        asset={selected}
        open={selected != null}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </div>
  );
}
