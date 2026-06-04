"use client";

import { useEffect, useState } from "react";
import type { LegacyPlaybook, Playbook } from "@/lib/types";
import { migratePlaybook } from "@/lib/playbook-migrate";
import { PREDEFINED_ALERTS } from "@/lib/types";
import { useDcsStore } from "@/stores/dcs-store";
import { useEnabledTags } from "@/hooks/use-enabled-tags";
import {
  createEmptyPlaybook,
  defaultAlertFromPredefined,
} from "@/stores/playbook-store";
import {
  ConditionsBuilder,
  hasValidConditions,
} from "@/components/conditions-builder";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AlertTriangle, Info, PlugZap, Zap } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbook?: Playbook;
  onSave: (data: Omit<Playbook, "id"> & { id?: string }) => void;
};

const ALERT_ICONS = {
  critical: Zap,
  warning: AlertTriangle,
  info: Info,
} as const;

export function PlaybookFormDialog({
  open,
  onOpenChange,
  playbook,
  onSave,
}: Props) {
  const connected = useDcsStore((s) => s.connected);
  const tags = useEnabledTags();
  const [form, setForm] = useState(createEmptyPlaybook());

  useEffect(() => {
    if (playbook) {
      const pb = migratePlaybook(playbook as LegacyPlaybook);
      setForm({
        name: pb.name,
        description: pb.description ?? "",
        status: pb.status,
        conditions: pb.conditions,
        matchMode: pb.matchMode,
        alert: pb.alert,
      });
    } else {
      setForm(createEmptyPlaybook());
    }
  }, [playbook, open]);

  const disabled = !connected;

  function handleSubmit() {
    if (!form.name.trim() || !hasValidConditions(form.conditions)) return;

    onSave({
      ...(playbook ? { id: playbook.id } : {}),
      name: form.name.trim(),
      description: form.description?.trim(),
      status: form.status,
      conditions: form.conditions,
      matchMode: form.matchMode,
      alert: form.alert,
      lastTriggeredAt: playbook?.lastTriggeredAt,
    });
    onOpenChange(false);
  }

  const alertId =
    form.alert.type === "custom"
      ? "custom"
      : (form.alert.predefinedId ?? "warning");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/20">
          <DialogTitle className="text-xl">
            {playbook ? "Edit playbook" : "New playbook"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Set signal conditions — when they match, the alert fires.
          </p>
        </DialogHeader>

        <div className="px-6 py-5 space-y-8 max-h-[70vh] overflow-y-auto">
          {disabled && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-3">
              <p>
                Connect a signal source on Integrations first to pick signals.
              </p>
              <Button asChild size="sm" className="gap-2 shrink-0">
                <Link href="/integrations">
                  <PlugZap className="h-4 w-4" />
                  Connect
                </Link>
              </Button>
            </div>
          )}

          <section className="space-y-3">
            <Label htmlFor="name" className="text-base font-semibold">
              Playbook name
            </Label>
            <Input
              id="name"
              className="h-12 text-lg"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="e.g. High reactor temperature"
            />
          </section>

          <ConditionsBuilder
            conditions={form.conditions}
            matchMode={form.matchMode}
            onConditionsChange={(conditions) =>
              setForm((f) => ({ ...f, conditions }))
            }
            onMatchModeChange={(matchMode) =>
              setForm((f) => ({ ...f, matchMode }))
            }
            tags={tags}
            disabled={disabled}
            alertTitle={form.alert.title || "Alert"}
          />

          <section className="space-y-3">
            <Label className="text-base font-semibold">Then send alert</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {PREDEFINED_ALERTS.map((a) => {
                const Icon = ALERT_ICONS[a.severity];
                const selected = alertId === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        alert: defaultAlertFromPredefined(a.id),
                      }))
                    }
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-all",
                      selected
                        ? "border-primary bg-primary/15 shadow-md"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 mb-2",
                        a.severity === "critical" && "text-red-400",
                        a.severity === "warning" && "text-amber-400",
                        a.severity === "info" && "text-sky-400",
                      )}
                    />
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {a.message}
                    </p>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  alert: {
                    type: "custom",
                    title: f.alert.type === "custom" ? f.alert.title : "",
                    message:
                      f.alert.type === "custom" ? f.alert.message : "",
                    severity: "warning",
                  },
                }))
              }
              className={cn(
                "w-full rounded-lg border px-4 py-2 text-sm",
                alertId === "custom"
                  ? "border-primary bg-primary/10"
                  : "border-dashed text-muted-foreground",
              )}
            >
              Custom message…
            </button>
            {form.alert.type === "custom" && (
              <div className="grid gap-2">
                <Input
                  placeholder="Alert title"
                  value={form.alert.title}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      alert: { ...f.alert, title: e.target.value },
                    }))
                  }
                />
                <Input
                  placeholder="What should the operator do?"
                  value={form.alert.message}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      alert: { ...f.alert, message: e.target.value },
                    }))
                  }
                />
              </div>
            )}
          </section>

          <section className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="font-medium">Enable immediately</p>
              <p className="text-xs text-muted-foreground">
                Active playbooks are evaluated on each signal refresh
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.status === "active"}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  status: f.status === "active" ? "disabled" : "active",
                }))
              }
              className={cn(
                "relative h-8 w-14 rounded-full transition-colors",
                form.status === "active" ? "bg-primary" : "bg-input",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform",
                  form.status === "active" && "translate-x-6",
                )}
              />
            </button>
          </section>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/10">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={
              !form.name.trim() || !hasValidConditions(form.conditions)
            }
          >
            {playbook ? "Save playbook" : "Create playbook"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
