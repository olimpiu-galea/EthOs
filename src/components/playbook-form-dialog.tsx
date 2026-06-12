"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  LegacyPlaybook,
  Playbook,
  PlaybookActionItem,
  PlaybookGuidanceStep,
} from "@/lib/types";
import { migratePlaybook } from "@/lib/playbook-migrate";
import { PREDEFINED_ALERTS } from "@/lib/types";
import { useEnabledTags } from "@/hooks/use-enabled-tags";
import { useFermCatalogTags } from "@/hooks/use-ferm-catalog-tags";
import { useAnyIntegrationConnected } from "@/hooks/use-all-signal-tags";
import { useLabStore } from "@/stores/lab-store";
import {
  createEmptyPlaybook,
  defaultAlertFromPredefined,
} from "@/stores/playbook-store";
import { ConditionsBuilder } from "@/components/conditions-builder";
import { hasValidPlaybookConditions } from "@/lib/playbook-utils";
import { conditionsPreviewForPlaybook } from "@/lib/rule-evaluator";
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
import {
  AlertTriangle,
  Info,
  Loader2,
  Plus,
  PlugZap,
  Sparkles,
  Trash2,
  Settings,
  Wand2,
  Zap,
} from "lucide-react";
import {
  generatePlaybookFromDescription,
  previewPlaybookConditions,
} from "@/lib/ai-playbook-generator";
import { inferRoutedRoles } from "@/lib/playbook-routing";
import {
  mockBacktestResult,
  type BacktestResult,
} from "@/lib/playbook-backtest";
import { Badge } from "@/components/ui/badge";
import { listUsersForCompany } from "@/lib/company-registry";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { enabledTeams, routedRolesForTeam } from "@/lib/teams";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function newActionItem(): PlaybookActionItem {
  return { id: crypto.randomUUID(), title: "", detail: "" };
}

function newGuidanceStep(): PlaybookGuidanceStep {
  return { title: "", body: "" };
}

export function PlaybookFormDialog({
  open,
  onOpenChange,
  playbook,
  onSave,
}: Props) {
  const connected = useAnyIntegrationConnected();
  const labConnected = useLabStore((s) => s.connected);
  const enabledTags = useEnabledTags();
  const { tags: fermCatalog, ready: fermCatalogReady } = useFermCatalogTags();
  const tags = useMemo(() => {
    const seen = new Set(enabledTags.map((t) => t._key));
    const extra = fermCatalog.filter((t) => !seen.has(t._key));
    return [...enabledTags, ...extra];
  }, [enabledTags, fermCatalog]);
  const companyId = useSettingsStore((s) => s.companyId);
  const allTeams = useSettingsStore((s) => s.teams);
  const registeredUsers = useAuthStore((s) => s.users);
  const teams = useMemo(() => enabledTeams(allTeams), [allTeams]);
  const companyUsers = useMemo(
    () => listUsersForCompany(companyId, registeredUsers),
    [companyId, registeredUsers],
  );
  const [form, setForm] = useState(createEmptyPlaybook());
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPreview, setAiPreview] = useState<Omit<Playbook, "id"> | null>(
    null,
  );
  const [backtestOpen, setBacktestOpen] = useState(false);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(
    null,
  );

  useEffect(() => {
    if (playbook) {
      const pb = migratePlaybook(playbook as LegacyPlaybook);
      setForm({
        name: pb.name,
        description: pb.description ?? "",
        status: pb.status,
        builtinId: pb.builtinId,
        conditions: pb.conditions,
        matchMode: pb.matchMode,
        conditionGroups: pb.conditionGroups,
        groupMatchMode: pb.groupMatchMode,
        alert: pb.alert,
        teamId: pb.teamId ?? teams[0]?.id,
        actionItems: pb.actionItems,
        guidance: pb.guidance,
      });
      setMode("manual");
    } else {
      setForm(createEmptyPlaybook());
      setMode("manual");
      setAiPrompt("");
      setAiPreview(null);
    }
  }, [playbook, open, teams]);

  const allFormConditions = [
    ...form.conditions,
    ...(form.conditionGroups?.flatMap((g) => g.conditions) ?? []),
  ];
  const hasFermConditions = allFormConditions.some((c) =>
    c.rule.signalId.startsWith("FERM-"),
  );
  const grouped = (form.conditionGroups?.length ?? 0) > 0;
  const canEditConditions =
    connected ||
    hasFermConditions ||
    fermCatalog.length > 0 ||
    !fermCatalogReady;
  const disabled = !canEditConditions;

  function handleSubmit() {
    if (
      !form.name.trim() ||
      !hasValidPlaybookConditions(form) ||
      (teams.length > 0 && !form.teamId)
    ) {
      return;
    }
    const actionItems = form.actionItems.filter((a) => a.title.trim());
    const guidance = form.guidance.filter((g) => g.title.trim());

    onSave({
      ...(playbook ? { id: playbook.id } : {}),
      name: form.name.trim(),
      description: form.description?.trim(),
      status: form.status,
      builtinId: form.builtinId,
      conditions: grouped ? [] : form.conditions,
      matchMode: form.matchMode,
      conditionGroups: grouped ? form.conditionGroups : undefined,
      groupMatchMode: grouped ? (form.groupMatchMode ?? form.matchMode) : undefined,
      alert: {
        ...form.alert,
        title: form.alert.title.trim() || "Alert",
        message: form.alert.message.trim() || "Operator action required",
      },
      teamId: form.teamId ?? teams[0]?.id,
      routedRoles:
        routedRolesForTeam(
          form.teamId ?? teams[0]?.id,
          allTeams,
          companyUsers,
        ) ?? inferRoutedRoles(form),
      actionItems,
      guidance,
      lastTriggeredAt: playbook?.lastTriggeredAt,
    });
    onOpenChange(false);
  }

  function runAiGenerate() {
    const generated = generatePlaybookFromDescription(aiPrompt);
    setAiPreview(generated);
    setForm(generated);
  }

  function runBacktest() {
    setBacktestOpen(true);
    setBacktestLoading(true);
    setBacktestResult(null);
    window.setTimeout(() => {
      setBacktestResult(
        mockBacktestResult({
          name: form.name,
          alert: form.alert,
          conditions: form.conditions,
          matchMode: form.matchMode,
          conditionGroups: form.conditionGroups,
          groupMatchMode: form.groupMatchMode,
          conditionsSummary: conditionsPreviewForPlaybook(form),
        }),
      );
      setBacktestLoading(false);
    }, 1600);
  }

  function closeBacktestModal() {
    setBacktestOpen(false);
    setBacktestLoading(false);
    setBacktestResult(null);
  }

  const alertId = form.alert.predefinedId ?? "warning";

  function updateActionItem(
    id: string,
    patch: Partial<PlaybookActionItem>,
  ) {
    setForm((f) => ({
      ...f,
      actionItems: f.actionItems.map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      ),
    }));
  }

  function updateGuidance(
    index: number,
    patch: Partial<PlaybookGuidanceStep>,
  ) {
    setForm((f) => ({
      ...f,
      guidance: f.guidance.map((g, i) =>
        i === index ? { ...g, ...patch } : g,
      ),
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[92vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/20">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="space-y-1 min-w-0">
              <DialogTitle className="text-xl">
                {playbook ? "Edit playbook" : "New playbook"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground font-normal">
                Conditions, alert, action items & guidance
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  status: f.status === "active" ? "disabled" : "active",
                }))
              }
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                form.status === "active"
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40",
              )}
            >
              {form.status === "active" ? "Deactivate" : "Activate"}
            </button>
          </div>
          {!playbook && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={cn(
                  "text-xs rounded-full px-3 py-1 border",
                  mode === "manual"
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setMode("ai")}
                className={cn(
                  "text-xs rounded-full px-3 py-1 border flex items-center gap-1",
                  mode === "ai"
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                <Wand2 className="h-3 w-3" />
                Generate with AI
              </button>
            </div>
          )}
        </DialogHeader>

        <div className="px-6 py-5 space-y-8 max-h-[calc(92vh-11rem)] overflow-y-auto">
          {disabled && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-4 py-3">
              <p>
                {fermCatalogReady
                  ? "Connect Lab Sheet (Ferm Data) or another signal source on Integrations first."
                  : "Loading Ferm Data field dictionary…"}
              </p>
              {fermCatalogReady && (
                <Button asChild size="sm" className="gap-2 shrink-0">
                  <Link href="/integrations">
                    <PlugZap className="h-4 w-4" />
                    Connect
                  </Link>
                </Button>
              )}
            </div>
          )}
          {!disabled && hasFermConditions && !labConnected && (
            <div className="text-sm text-muted-foreground bg-muted/30 border border-border rounded-lg px-4 py-3">
              Ferm Data signals are shown from the field dictionary. Connect{" "}
              <strong>Lab Sheet</strong> on Integrations for live values.
            </div>
          )}

          {mode === "ai" && !playbook && (
            <section className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Describe what the playbook should cover
              </Label>
              <textarea
                className="w-full min-h-[80px] rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Alert when fermentation temp exceeds 92°F for 30 min"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={runAiGenerate}
                disabled={!aiPrompt.trim()}
              >
                <Wand2 className="h-4 w-4" />
                Generate preview
              </Button>
              {aiPreview && (
                <div className="text-sm space-y-1 rounded-lg border bg-card p-3">
                  <p className="font-medium">{aiPreview.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    IF {previewPlaybookConditions(aiPreview.conditions)}
                  </p>
                </div>
              )}
            </section>
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
              placeholder="e.g. Fermentation temperature deviation"
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
            conditionGroups={form.conditionGroups}
            groupMatchMode={form.groupMatchMode}
            onConditionGroupsChange={(conditionGroups) =>
              setForm((f) => ({ ...f, conditionGroups }))
            }
            onGroupMatchModeChange={(groupMatchMode) =>
              setForm((f) => ({ ...f, groupMatchMode }))
            }
            tags={tags}
            disabled={disabled}
            alertTitle={form.alert.title || "Alert"}
          />

          <section className="space-y-2">
            <Label className="text-base font-semibold">Assigned team</Label>
            <p className="text-xs text-muted-foreground">
              Alerts from this playbook are routed to this team on the Agenda
            </p>
            {teams.length === 0 ? (
              <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-3 space-y-2">
                <p>
                  Create at least one team in Settings before assigning a
                  playbook.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/40 text-amber-100 hover:bg-amber-500/15 hover:text-amber-50"
                  asChild
                >
                  <Link href="/settings?tab=features">
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    Go to Settings
                  </Link>
                </Button>
              </div>
            ) : (
              <Select
                value={form.teamId ?? teams[0]?.id ?? ""}
                onValueChange={(teamId) => setForm((f) => ({ ...f, teamId }))}
                disabled={disabled}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </section>

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
                        alert: {
                          ...defaultAlertFromPredefined(a.id),
                          message:
                            f.alert.predefinedId === a.id
                              ? f.alert.message
                              : a.message,
                        },
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

            <div className="grid gap-3 rounded-xl border border-border/80 bg-muted/10 p-4">
              <div className="space-y-2">
                <Label htmlFor="alert-message" className="text-sm">
                  Alert message
                </Label>
                <textarea
                  id="alert-message"
                  className="w-full min-h-[72px] rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="What should the operator see when this fires?"
                  value={form.alert.message}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      alert: { ...f.alert, message: e.target.value },
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Shown on the agenda and in notifications — customize per
                  playbook.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-base font-semibold">Action items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    actionItems: [...f.actionItems, newActionItem()],
                  }))
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add item
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Checklist shown in the alert detail modal on Agenda
            </p>
            {form.actionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground border border-dashed rounded-lg px-4 py-6 text-center">
                No action items — add steps for operators to follow
              </p>
            ) : (
              <ul className="space-y-3">
                {form.actionItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-border/80 p-3 space-y-2"
                  >
                    <div className="flex gap-2">
                      <Input
                        placeholder="Action title"
                        value={item.title}
                        onChange={(e) =>
                          updateActionItem(item.id, { title: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            actionItems: f.actionItems.filter(
                              (a) => a.id !== item.id,
                            ),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <textarea
                      className="w-full min-h-[56px] rounded-lg border bg-background px-3 py-2 text-sm"
                      placeholder="Detail — what should they do?"
                      value={item.detail}
                      onChange={(e) =>
                        updateActionItem(item.id, { detail: e.target.value })
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-base font-semibold">Guidance steps</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    guidance: [...f.guidance, newGuidanceStep()],
                  }))
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add step
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Phased operator guidance shown when resolving the alert
            </p>
            {form.guidance.length === 0 ? (
              <p className="text-sm text-muted-foreground border border-dashed rounded-lg px-4 py-6 text-center">
                No guidance steps — add SOP context for responders
              </p>
            ) : (
              <ul className="space-y-3">
                {form.guidance.map((step, index) => (
                  <li
                    key={index}
                    className="rounded-lg border border-border/80 p-3 space-y-2"
                  >
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-mono text-primary w-6">
                        {index + 1}.
                      </span>
                      <Input
                        placeholder="Step title"
                        value={step.title}
                        onChange={(e) =>
                          updateGuidance(index, { title: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            guidance: f.guidance.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <textarea
                      className="w-full min-h-[56px] rounded-lg border bg-background px-3 py-2 text-sm ml-8"
                      placeholder="Guidance body"
                      value={step.body}
                      onChange={(e) =>
                        updateGuidance(index, { body: e.target.value })
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/10">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={!hasValidPlaybookConditions(form) || backtestLoading}
            onClick={runBacktest}
          >
            Run backtest
          </Button>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={
              !form.name.trim() ||
              !hasValidPlaybookConditions(form) ||
              (teams.length > 0 && !form.teamId)
            }
          >
            {playbook ? "Save playbook" : "Create playbook"}
          </Button>
        </div>
      </DialogContent>

      <Dialog open={backtestOpen} onOpenChange={(v) => !v && closeBacktestModal()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>7-day backtest results</DialogTitle>
            <p className="text-sm text-muted-foreground text-left pt-1">
              Fixture replay against the last 7 calendar days. Use this to
              estimate alert volume before activating the playbook.
            </p>
          </DialogHeader>
          {backtestLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-base font-medium">Replaying fixture history…</p>
              <div className="rounded-lg border bg-muted/30 px-4 py-3 max-w-lg w-full text-left space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Evaluating
                </p>
                <p
                  className="text-sm font-mono text-primary/90 line-clamp-2 break-words"
                  title={`IF ${conditionsPreviewForPlaybook(form)}`}
                >
                  IF {conditionsPreviewForPlaybook(form)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Match:{" "}
                  {grouped
                    ? form.groupMatchMode === "all"
                      ? "ALL rule groups"
                      : "ANY rule group"
                    : form.matchMode === "all"
                      ? "ALL conditions"
                      : "ANY condition"}
                </p>
              </div>
            </div>
          ) : backtestResult ? (
            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">
                      {form.name.trim() || "Untitled playbook"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Alert: {form.alert.title} · {form.alert.severity}
                    </p>
                  </div>
                  {teams.find((t) => t.id === form.teamId)?.name && (
                    <Badge variant="outline">
                      Team: {teams.find((t) => t.id === form.teamId)?.name}
                    </Badge>
                  )}
                </div>
                <p
                  className="text-sm font-mono text-primary/90 rounded-lg bg-background/60 border px-3 py-2 line-clamp-2 break-words"
                  title={`IF ${conditionsPreviewForPlaybook(form)}`}
                >
                  IF {conditionsPreviewForPlaybook(form)}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">
                    {grouped
                      ? form.groupMatchMode === "all"
                        ? "Match ALL groups"
                        : "Match ANY group"
                      : form.matchMode === "all"
                        ? "Match ALL"
                        : "Match ANY"}
                  </Badge>
                  {teams.find((t) => t.id === form.teamId)?.name && (
                    <Badge variant="outline">
                      Team: {teams.find((t) => t.id === form.teamId)?.name}
                    </Badge>
                  )}
                  <Badge variant="secondary">5 min cooldown</Badge>
                  <Badge variant="secondary">7-day window</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-3xl font-bold text-primary tabular-nums">
                    {backtestResult.hits}
                  </p>
                  <p className="text-[10px] uppercase text-muted-foreground mt-1">
                    Total hits
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 text-center">
                  <p className="text-3xl font-bold tabular-nums">
                    {backtestResult.avgPerDay}
                  </p>
                  <p className="text-[10px] uppercase text-muted-foreground mt-1">
                    Avg / day
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4 text-center sm:col-span-2">
                  <p className="text-lg font-bold tabular-nums leading-tight">
                    {backtestResult.peakDay}
                  </p>
                  <p className="text-[10px] uppercase text-muted-foreground mt-1">
                    Peak day
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Hits per day
                </p>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Day</th>
                        <th className="px-3 py-2 font-medium text-right">Hits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        backtestResult.events.reduce<Record<string, number>>(
                          (acc, e) => {
                            acc[e.dayLabel] = (acc[e.dayLabel] ?? 0) + 1;
                            return acc;
                          },
                          {},
                        ),
                      ).map(([day, count]) => (
                        <tr key={day} className="border-b border-border/40">
                          <td className="px-3 py-2">{day}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium">
                            {count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sample alerts generated ({backtestResult.events.length})
                </p>
                <ul className="max-h-72 overflow-y-auto rounded-lg border bg-muted/20 divide-y divide-border/60 text-sm">
                  {backtestResult.events.map((e, i) => (
                    <li key={i} className="px-4 py-3 space-y-1.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">
                            {e.alertTitle}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {e.alertMessage}
                          </p>
                        </div>
                        <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">
                          {new Date(e.triggeredAt).toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {e.batchId && (
                          <Badge variant="outline">
                            Batch {e.batchId}
                            {e.fermenter ? ` · ${e.fermenter}` : ""}
                          </Badge>
                        )}
                        {e.phaseLabel && (
                          <Badge variant="secondary">{e.phaseLabel}</Badge>
                        )}
                        <span
                          className="inline-block max-w-full rounded-md border border-transparent bg-secondary px-2 py-0.5 text-[10px] font-mono text-secondary-foreground line-clamp-2 break-words whitespace-normal"
                          title={e.conditionsSummary}
                        >
                          {e.conditionsSummary}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <Badge variant="outline" className="text-[10px]">
                  Demo replay · not saved to playbook
                </Badge>
                <Button onClick={closeBacktestModal}>Close</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
