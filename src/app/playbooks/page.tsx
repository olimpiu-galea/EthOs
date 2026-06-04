"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, PlugZap, Plus } from "lucide-react";
import { activateTagsForPlaybookConditions } from "@/lib/tag-activation";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useDcsStore } from "@/stores/dcs-store";
import { useTagActivationStore } from "@/stores/tag-activation-store";
import type { Playbook } from "@/lib/types";
import { runPlaybookBackfill } from "@/lib/run-playbook-backfill";
import { toast } from "@/components/ui/use-toast";
import { isDemoPlaybook } from "@/lib/demo-playbook";
import { conditionsPreview } from "@/lib/rule-evaluator";
import { PlaybookFormDialog } from "@/components/playbook-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function PlaybooksPage() {
  const playbooks = usePlaybookStore((s) => s.playbooks);
  const hasHydrated = usePlaybookStore((s) => s._hasHydrated);
  const addPlaybook = usePlaybookStore((s) => s.addPlaybook);
  const updatePlaybook = usePlaybookStore((s) => s.updatePlaybook);
  const toggleStatus = usePlaybookStore((s) => s.toggleStatus);
  const connected = useDcsStore((s) => s.connected);
  const allTags = useDcsStore((s) => s.tags);
  const setTagActive = useTagActivationStore((s) => s.setTagActive);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Playbook | undefined>();

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

    activateTagsForPlaybookConditions(
      playbook.conditions,
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
            When your conditions match live signals, the assigned alert fires
            automatically.
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

      {!connected && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
          <p>
            Connect a signal source on Integrations to pick signals when building
            playbooks.
          </p>
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
            Toggle active or edit conditions and alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasHydrated ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading playbooks…
            </div>
          ) : playbooks.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No playbooks yet. Create one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">When (conditions)</th>
                    <th className="pb-3 pr-4 font-medium">Alert</th>
                    <th className="pb-3 pr-4 font-medium">Active</th>
                    <th className="pb-3 pr-4 font-medium">Last triggered</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {playbooks.map((pb) => (
                    <tr
                      key={pb.id}
                      className="border-b border-border/40 hover:bg-muted/20"
                    >
                      <td className="py-4 pr-4">
                        <p className="font-medium">{pb.name}</p>
                      </td>
                      <td className="py-4 pr-4 max-w-md">
                        <p className="text-sm font-medium text-primary/90">
                          IF{" "}
                          {conditionsPreview(
                            pb.conditions ?? [],
                            pb.matchMode ?? "all",
                          ) || "—"}
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
                          {pb.alert.title}
                        </Badge>
                      </td>
                      <td className="py-4 pr-4">
                        {isDemoPlaybook(pb) ? (
                          <Badge variant="success" className="text-xs">
                            Always on
                          </Badge>
                        ) : (
                          <Switch
                            checked={pb.status === "active"}
                            onCheckedChange={() => toggleStatus(pb.id)}
                          />
                        )}
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground">
                        {pb.lastTriggeredAt
                          ? new Date(pb.lastTriggeredAt).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-4">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PlaybookFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        playbook={editing}
        onSave={handleSave}
      />
    </div>
  );
}
