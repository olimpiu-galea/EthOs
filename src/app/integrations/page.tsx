"use client";

import { useMemo, useState } from "react";
import { Plug, Search, Tags, Clock } from "lucide-react";
import { ConnectionHub } from "@/components/integrations/connection-hub";
import { useDcsStore } from "@/stores/dcs-store";
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

export default function IntegrationsPage() {
  const connected = useDcsStore((s) => s.connected);
  const loading = useDcsStore((s) => s.loading);
  const historySyncing = useDcsStore((s) => s.historySyncing);
  const error = useDcsStore((s) => s.error);
  const tags = useDcsStore((s) => s.tags);
  const lastSync = useDcsStore((s) => s.lastSync);
  const connect = useDcsStore((s) => s.connect);
  const disconnect = useDcsStore((s) => s.disconnect);
  const playbooks = usePlaybookStore((s) => s.playbooks);
  const inactiveTagKeys = useTagActivationStore((s) => s.inactiveTagKeys);
  const setTagActive = useTagActivationStore((s) => s.setTagActive);
  const [query, setQuery] = useState("");

  const activePlaybooks = playbooks.filter((p) => p.status === "active").length;
  const enabledTagCount = useMemo(
    () =>
      tags.filter((t) => isTagEnabled(t, inactiveTagKeys, playbooks)).length,
    [tags, inactiveTagKeys, playbooks],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return tags;
    return tags.filter(
      (t) =>
        t.displayLabel.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q),
    );
  }, [tags, query]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground max-w-2xl">
          Connect signal sources and choose which signals are active in the app.
          Today: DCS mock integration (nine-field template, ~60s refresh). More
          sources — inventory, market — coming soon.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Signals active / loaded</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Tags className="h-6 w-6 text-primary" />
              {connected ? `${enabledTagCount} / ${tags.length}` : "—"}
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

      <ConnectionHub
        connected={connected}
        loading={loading}
        historySyncing={historySyncing}
        error={error}
        onConnect={() => void connect()}
        onDisconnect={() => disconnect()}
      />

      {!connected ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <Plug className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
            <p className="text-lg font-medium">No signals loaded</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Connect a source (e.g. DCS) to load signals from the fixture.
              While disconnected, no live signal data appears in the app.
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
                  Enable signals for playbooks and evaluation. Signals used in
                  playbooks cannot be turned off.
                </CardDescription>
              </div>
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
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Display</th>
                  <th className="pb-3 pr-4 font-medium">ID</th>
                  <th className="pb-3 pr-4 font-medium">Value</th>
                  <th className="pb-3 pr-4 font-medium">Unit</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">Frequency</th>
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
                      "border-b border-border/40 hover:bg-muted/30 transition-colors",
                      !enabled && "opacity-50",
                    )}
                  >
                    <td className="py-3 pr-4 font-medium">{t.displayLabel}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                      {t.id}
                    </td>
                    <td className="py-3 pr-4 text-primary font-semibold tabular-nums">
                      {String(numericValue(t.value))}
                    </td>
                    <td className="py-3 pr-4">{t.unit}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline">{t.category}</Badge>
                    </td>
                    <td className="py-3 pr-4">{t.frequency}</td>
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
                          aria-label={`${t.displayLabel} active`}
                        />
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
