"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plug, Search, Tags, Clock, Upload } from "lucide-react";
import { ConnectionHub } from "@/components/integrations/connection-hub";
import { LabConnectModal } from "@/components/integrations/lab-connect-modal";
import { useDcsStore } from "@/stores/dcs-store";
import { useLabStore } from "@/stores/lab-store";
import { useCommodityStore } from "@/stores/commodity-store";
import { useInventoryStore } from "@/stores/inventory-store";
import { useAuthStore } from "@/stores/auth-store";
import { canSeeIntegrations, workspaceHomePath } from "@/lib/role-access";
import { tagKey, numericValue } from "@/lib/dcs-parser";
import {
  isTagEnabled,
  isTagLockedInPlaybooks,
} from "@/lib/tag-activation";
import { useTagActivationStore } from "@/stores/tag-activation-store";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useAllSignalTags } from "@/hooks/use-all-signal-tags";
import { isIntegrationStale } from "@/lib/integration-health";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import type { LabFieldSchema } from "@/lib/lab-sheet";
import {
  anyCompanyFeedEnabled,
  isCompanyFeedAvailable,
} from "@/lib/company-feed-visibility";

const SOURCE_LABELS = {
  dcs: "DCS",
  lab: "Lab Sheet",
  commodity: "Commodity",
  inventory: "Inventory",
} as const;

type SourceFilter = keyof typeof SOURCE_LABELS | "all";

export default function IntegrationsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const dcsConnected = useDcsStore((s) => s.connected);
  const dcsLoading = useDcsStore((s) => s.loading);
  const historySyncing = useDcsStore((s) => s.historySyncing);
  const dcsError = useDcsStore((s) => s.error);
  const connectDcs = useDcsStore((s) => s.connect);
  const disconnectDcs = useDcsStore((s) => s.disconnect);
  const dcsLastSync = useDcsStore((s) => s.lastSync);
  const labLastSync = useLabStore((s) => s.lastSync);
  const commodityLastSync = useCommodityStore((s) => s.lastSync);
  const inventoryLastSync = useInventoryStore((s) => s.lastSync);

  const labConnected = useLabStore((s) => s.connected);
  const labLoading = useLabStore((s) => s.loading);
  const labError = useLabStore((s) => s.error);
  const connectLab = useLabStore((s) => s.connect);
  const disconnectLab = useLabStore((s) => s.disconnect);
  const uploadLabSheet = useLabStore((s) => s.uploadSheet);
  const labUploadError = useLabStore((s) => s.uploadError);
  const labLastUpload = useLabStore((s) => s.lastUploadName);
  const labSchema = useLabStore((s) => s.schema);

  const commodityConnected = useCommodityStore((s) => s.connected);
  const commodityLoading = useCommodityStore((s) => s.loading);
  const commodityError = useCommodityStore((s) => s.error);
  const connectCommodity = useCommodityStore((s) => s.connect);
  const disconnectCommodity = useCommodityStore((s) => s.disconnect);

  const inventoryConnected = useInventoryStore((s) => s.connected);
  const inventoryLoading = useInventoryStore((s) => s.loading);
  const inventoryError = useInventoryStore((s) => s.error);
  const connectInventory = useInventoryStore((s) => s.connect);
  const disconnectInventory = useInventoryStore((s) => s.disconnect);

  const phrase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);
  const companyFeeds = useSettingsStore((s) => s.companyFeeds);
  const [labModalOpen, setLabModalOpen] = useState(false);
  const labUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !canSeeIntegrations(user.role)) {
      router.replace(workspaceHomePath(user.role));
    }
  }, [user, router]);

  const allTags = useAllSignalTags();
  const playbooks = usePlaybookStore((s) => s.playbooks);
  const inactiveTagKeys = useTagActivationStore((s) => s.inactiveTagKeys);
  const setTagActive = useTagActivationStore((s) => s.setTagActive);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");

  const feedOpts = useMemo(
    () => ({ companyFeeds, phrase2Enabled }),
    [companyFeeds, phrase2Enabled],
  );

  const sourceFilters = useMemo((): SourceFilter[] => {
    const base: SourceFilter[] = ["all"];
    if (isCompanyFeedAvailable("dcs", feedOpts)) base.push("dcs");
    if (isCompanyFeedAvailable("lab", feedOpts)) base.push("lab");
    if (isCompanyFeedAvailable("commodity", feedOpts)) base.push("commodity");
    if (isCompanyFeedAvailable("inventory", feedOpts)) base.push("inventory");
    return base;
  }, [feedOpts]);

  async function handleLabConnect(fields: LabFieldSchema[]) {
    await connectLab(fields);
    setLabModalOpen(false);
  }

  async function handleLabUpload(file: File) {
    const ok = await uploadLabSheet(file);
    if (ok) {
      toast({
        title: "Lab sheet updated",
        description: `${file.name} matched your mapped structure.`,
      });
    }
  }

  useEffect(() => {
    if (!phrase2Enabled && (sourceFilter === "commodity" || sourceFilter === "inventory")) {
      setSourceFilter("all");
    }
  }, [phrase2Enabled, sourceFilter]);

  const anyFeedEnabled = anyCompanyFeedEnabled(companyFeeds, phrase2Enabled);
  const anyConnected =
    (isCompanyFeedAvailable("dcs", feedOpts) && dcsConnected) ||
    (isCompanyFeedAvailable("lab", feedOpts) && labConnected) ||
    (isCompanyFeedAvailable("commodity", feedOpts) && commodityConnected) ||
    (isCompanyFeedAvailable("inventory", feedOpts) && inventoryConnected);
  const activePlaybooks = playbooks.filter((p) => p.status === "active").length;
  const enabledTagCount = useMemo(
    () =>
      allTags.filter((t) => isTagEnabled(t, inactiveTagKeys, playbooks)).length,
    [allTags, inactiveTagKeys, playbooks],
  );

  const lastSync = useMemo(() => {
    const times = [
      useDcsStore.getState().lastSync,
      useLabStore.getState().lastSync,
      useCommodityStore.getState().lastSync,
      useInventoryStore.getState().lastSync,
    ].filter((t): t is number => t != null);
    if (!times.length) return null;
    return Math.max(...times);
  }, [dcsConnected, labConnected, commodityConnected, inventoryConnected]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allTags.filter((t) => {
      const source = t.source ?? "dcs";
      if (!isCompanyFeedAvailable(source, feedOpts)) return false;
      if (sourceFilter !== "all" && source !== sourceFilter) return false;
      if (!q) return true;
      return (
        t.displayLabel.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [allTags, query, sourceFilter, feedOpts]);

  if (user && !canSeeIntegrations(user.role)) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground max-w-2xl">
          Connect DCS, Lab Sheet, Commodity Margin, and Inventory feeds. All
          sources share the same field model for cross-source playbooks.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Signals active / loaded</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Tags className="h-6 w-6 text-primary" />
              {anyConnected ? `${enabledTagCount} / ${allTags.length}` : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active playbooks</CardDescription>
            <CardTitle className="text-3xl">{activePlaybooks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last sync</CardDescription>
            <CardTitle className="text-lg flex items-center gap-2 font-medium">
              <Clock className="h-5 w-5 text-primary" />
              {lastSync
                ? new Date(lastSync).toLocaleString()
                : "Not connected"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <input
        ref={labUploadRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleLabUpload(file);
          e.target.value = "";
        }}
      />

      <LabConnectModal
        open={labModalOpen}
        onOpenChange={setLabModalOpen}
        onConfirm={(fields) => void handleLabConnect(fields)}
        loading={labLoading}
      />

      <ConnectionHub
        phrase2Enabled={phrase2Enabled}
        showDcs={companyFeeds.dcs}
        showLab={companyFeeds.lab}
        showCommodity={companyFeeds.commodity}
        showInventory={companyFeeds.inventory}
        dcs={{
          connected: dcsConnected,
          loading: dcsLoading,
          error: dcsError,
          stale: isIntegrationStale(dcsConnected, dcsLastSync),
          lastSync: dcsLastSync,
          onConnect: () => void connectDcs(),
          onDisconnect: () => disconnectDcs(),
          historySyncing,
        }}
        lab={{
          connected: labConnected,
          loading: labLoading,
          error: labError ?? labUploadError,
          stale: isIntegrationStale(labConnected, labLastSync),
          lastSync: labLastSync,
          onConnect: () => setLabModalOpen(true),
          onDisconnect: () => disconnectLab(),
          detail: labConnected
            ? `${labSchema.length} mapped fields${labLastUpload ? ` · ${labLastUpload}` : ""}`
            : undefined,
          connectedActions: labConnected ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs px-3 shrink-0"
              title="Upload XLSX / CSV update"
              onClick={() => labUploadRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          ) : undefined,
        }}
        commodity={{
          connected: commodityConnected,
          loading: commodityLoading,
          error: commodityError,
          stale: isIntegrationStale(commodityConnected, commodityLastSync),
          lastSync: commodityLastSync,
          onConnect: () => {
            if (phrase2Enabled) void connectCommodity();
          },
          onDisconnect: () => disconnectCommodity(),
        }}
        inventory={{
          connected: inventoryConnected,
          loading: inventoryLoading,
          error: inventoryError,
          stale: isIntegrationStale(inventoryConnected, inventoryLastSync),
          lastSync: inventoryLastSync,
          onConnect: () => {
            if (phrase2Enabled) void connectInventory();
          },
          onDisconnect: () => disconnectInventory(),
        }}
      />

      {!anyFeedEnabled ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <Plug className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
            <p className="text-lg font-medium">Enable signal feeds first</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              No sources are enabled for this company. Turn on DCS, Lab Sheet, or
              other feeds in Settings → Features, then connect them above.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <a href="/settings?tab=features">Settings → Features</a>
            </Button>
          </CardContent>
        </Card>
      ) : !anyConnected ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <Plug className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
            <p className="text-lg font-medium">No signals loaded</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Connect at least one enabled source above to load fields for
              playbooks.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Live signals</CardTitle>
                <CardDescription>
                  Unified field list from all connected sources
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {sourceFilters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSourceFilter(s)}
                    className={cn(
                      "text-xs rounded-full px-3 py-1 border transition-colors",
                      sourceFilter === s
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {s === "all" ? "All" : SOURCE_LABELS[s]}
                  </button>
                ))}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search signals…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-auto max-h-[min(60vh,calc(100vh-20rem))] scroll-smooth rounded-md border border-border/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground bg-card sticky top-0 z-10">
                  <th className="pb-3 pr-4 font-medium">Source</th>
                  <th className="pb-3 pr-4 font-medium">Display</th>
                  <th className="pb-3 pr-4 font-medium">Value</th>
                  <th className="pb-3 pr-4 font-medium">Unit</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 font-medium w-24">Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const enabled = isTagEnabled(t, inactiveTagKeys, playbooks);
                  const locked = isTagLockedInPlaybooks(t, playbooks);
                  const key = tagKey(t);
                  return (
                    <tr
                      key={t._key}
                      className={cn(
                        "border-b border-border/40 hover:bg-muted/30",
                        !enabled && "opacity-50",
                      )}
                    >
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="text-[10px]">
                          {SOURCE_LABELS[t.source ?? "dcs"]}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 font-medium">{t.displayLabel}</td>
                      <td className="py-3 pr-4 text-primary font-semibold tabular-nums">
                        {String(numericValue(t.value))}
                      </td>
                      <td className="py-3 pr-4">{t.unit}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{t.category}</Badge>
                      </td>
                      <td className="py-3">
                        {locked ? (
                          <Badge variant="success" className="text-xs">
                            Always on
                          </Badge>
                        ) : (
                          <Switch
                            checked={enabled}
                            onCheckedChange={(checked) =>
                              setTagActive(key, checked)
                            }
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
