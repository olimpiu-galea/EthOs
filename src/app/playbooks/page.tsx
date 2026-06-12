"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Pencil,
  PlugZap,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { activateTagsForPlaybookConditions } from "@/lib/tag-activation";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useAlertHistoryStore } from "@/stores/alert-history-store";
import { useAllSignalTags } from "@/hooks/use-all-signal-tags";
import { useAnyIntegrationConnected } from "@/hooks/use-all-signal-tags";
import { useTagActivationStore } from "@/stores/tag-activation-store";
import type { Playbook } from "@/lib/types";
import { alertTypeLabel } from "@/lib/types";
import { runPlaybookBackfill } from "@/lib/run-playbook-backfill";
import { toast } from "@/components/ui/use-toast";
import { isMockPlaybook } from "@/lib/mock-playbook-alerts";
import {
  isPlaybookEffectivelyActive,
  isPlaybookListed,
} from "@/lib/lab-sheet-availability";
import { playbookConditionsFlat } from "@/lib/playbook-utils";
import { conditionsPreviewForPlaybook } from "@/lib/rule-evaluator";
import { teamNameForId } from "@/lib/teams";
import { useSettingsStore } from "@/stores/settings-store";
import { Button } from "@/components/ui/button";

const PlaybookFormDialog = dynamic(
  () =>
    import("@/components/playbook-form-dialog").then((m) => m.PlaybookFormDialog),
  { ssr: false },
);
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PREMIUM_CATALOG } from "@/lib/premium-playbooks";
import { usePlaybookFeedbackStore } from "@/stores/playbook-feedback-store";

function PlaybookStats({
  id,
  backtestHits7d,
}: {
  id: string;
  backtestHits7d?: number;
}) {
  const pct = usePlaybookFeedbackStore((s) => s.helpfulPercent(id));
  if (pct == null && backtestHits7d == null) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {backtestHits7d != null && (
        <Badge variant="outline" className="text-[10px]">
          7d: {backtestHits7d} hits
        </Badge>
      )}
      {pct != null && (
        <Badge variant="outline" className="text-[10px]">
          {pct}% helpful
        </Badge>
      )}
    </div>
  );
}

export default function PlaybooksPage() {
  const teams = useSettingsStore((s) => s.teams);
  const playbooks = usePlaybookStore((s) => s.playbooks);
  const listedPlaybooks = playbooks.filter(isPlaybookListed);
  const hasHydrated = usePlaybookStore((s) => s._hasHydrated);
  const addPlaybook = usePlaybookStore((s) => s.addPlaybook);
  const updatePlaybook = usePlaybookStore((s) => s.updatePlaybook);
  const toggleStatus = usePlaybookStore((s) => s.toggleStatus);
  const deletePlaybook = usePlaybookStore((s) => s.deletePlaybook);
  const removeAlertsForPlaybook = useAlertHistoryStore(
    (s) => s.removeAlertsForPlaybook,
  );
  const connected = useAnyIntegrationConnected();
  const allTags = useAllSignalTags();
  const setTagActive = useTagActivationStore((s) => s.setTagActive);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Playbook | undefined>();
  const [deleting, setDeleting] = useState<Playbook | undefined>();

  function confirmDelete() {
    if (!deleting) return;
    deletePlaybook(deleting.id);
    removeAlertsForPlaybook(deleting.id);
    if (editing?.id === deleting.id) {
      setEditing(undefined);
      setDialogOpen(false);
    }
    toast({
      title: "Playbook deleted",
      description: `“${deleting.name}” and its agenda alerts were removed.`,
    });
    setDeleting(undefined);
  }

  async function handleSave(data: Omit<Playbook, "id"> & { id?: string }) {
    const { id, ...rest } = data;
    let playbook: Playbook;

    if (id) {
      updatePlaybook(id, rest);
      playbook = { ...rest, id } as Playbook;
    } else {
      const newId = addPlaybook(rest);
      playbook = { ...rest, id: newId } as Playbook;
    }

    if (isMockPlaybook(playbook)) {
      const { syncMockPlaybookAlerts } = await import(
        "@/lib/mock-playbook-alerts"
      );
      await syncMockPlaybookAlerts(playbook);
      toast({
        title: "Mock playbook saved",
        description:
          playbook.status === "active"
            ? `Pre-computed alerts for “${playbook.name}” are on the agenda.`
            : `“${playbook.name}” is off — its alerts are hidden from the agenda.`,
      });
      return;
    }

    activateTagsForPlaybookConditions(
      playbookConditionsFlat(playbook),
      allTags,
      setTagActive,
    );

    await runPlaybookBackfill(playbook);
    toast({
      title: "Agenda updated",
      description: `Recalculated alerts for “${playbook.name}”. Open Agenda to view.`,
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Playbooks</h1>
          <p className="text-muted-foreground max-w-2xl">
            When conditions match live signals, alerts fire to the right agenda
            team assignment with action items and guidance.
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-5 w-5" />
          Create playbook
        </Button>
      </header>

      {/* Signal team CTA */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-violet-500/10 to-background p-6 sm:p-8">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-widest">
                Signal Intelligence
              </span>
            </div>
            <h2 className="text-xl font-bold">
              Ask the Signal team to analyze your data
            </h2>
            <p className="text-sm text-muted-foreground">
              Our engineers review your connected feeds, historical alerts, and
              batch patterns — then deliver a custom playbook tuned to Lakeview.
            </p>
          </div>
          <Button size="lg" variant="outline" className="shrink-0 gap-2 border-primary/50">
            <Wand2 className="h-4 w-4" />
            Request analysis
          </Button>
        </div>
      </div>

      {!connected && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
          <p>Connect signal sources on Integrations to pick fields.</p>
          <Button asChild size="sm" className="gap-2 shrink-0">
            <Link href="/integrations">
              <PlugZap className="h-4 w-4" />
              Connect
            </Link>
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All playbooks</CardTitle>
          <CardDescription>
            Toggle active or edit conditions, team, and alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasHydrated ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading playbooks…
            </div>
          ) : listedPlaybooks.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No playbooks yet. Create one or activate a premium suggestion.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Team</th>
                    <th className="pb-3 pr-4 font-medium">When</th>
                    <th className="pb-3 pr-4 font-medium">Alert</th>
                    <th className="pb-3 pr-4 font-medium">Active</th>
                    <th className="pb-3 pr-4 font-medium">Last triggered</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listedPlaybooks.map((pb) => (
                    <tr
                      key={pb.id}
                      className="border-b border-border/40 hover:bg-muted/20"
                    >
                      <td className="py-4 pr-4 font-medium">
                        <div className="flex flex-wrap items-center gap-2">
                          {pb.name}
                        </div>
                        <PlaybookStats id={pb.id} backtestHits7d={pb.backtestHits7d} />
                      </td>
                      <td className="py-4 pr-4">
                        <Badge variant="outline" className="text-xs">
                          {teamNameForId(pb.teamId, teams)}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4 max-w-xs">
                        <p
                          className="text-primary/90 text-xs leading-relaxed line-clamp-3"
                          title={
                            conditionsPreviewForPlaybook(pb) || undefined
                          }
                        >
                          IF{" "}
                          {conditionsPreviewForPlaybook(pb) || "—"}
                        </p>
                      </td>
                      <td className="py-4 pr-4">
                        <Badge
                          variant={
                            pb.alert.severity === "critical"
                              ? "danger"
                              : pb.alert.severity === "warning"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {alertTypeLabel(pb.alert)}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4">
                        <Switch
                          checked={isPlaybookEffectivelyActive(pb)}
                          onCheckedChange={() => toggleStatus(pb.id)}
                        />
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground text-xs">
                        {pb.lastTriggeredAt
                          ? new Date(pb.lastTriggeredAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditing(pb);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleting(pb)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            AI-suggested playbooks
          </CardTitle>
          <CardDescription>
            Curated for ethanol operations — activate for a one-time fee
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {PREMIUM_CATALOG.map((item) => (
            <div
              key={item.catalogId}
              className="rounded-xl border border-violet-500/25 bg-card/60 p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <p className="font-semibold text-sm">{item.playbook.name}</p>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/40">
                  ${item.price}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{item.highlight}</p>
              <p className="text-[10px] uppercase text-violet-400/80">
                {teamNameForId(item.playbook.teamId, teams)} team
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full gap-2"
                disabled
              >
                <DollarSign className="h-3.5 w-3.5" />
                Buy & activate
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <PlaybookFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        playbook={editing}
        onSave={handleSave}
      />

      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(undefined);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete playbook?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            “{deleting?.name}” will be removed permanently, including its
            alerts on the agenda.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleting(undefined)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
