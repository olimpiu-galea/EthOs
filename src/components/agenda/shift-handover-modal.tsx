"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileBarChart, Lock, Save } from "lucide-react";
import type { AlertAgendaItem, UserRole } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  SHIFT_BAND_OPTIONS,
  SHIFT_HANDOVER_CHECKLIST,
  SHIFT_READONLY_FIELDS,
  buildReadinessChecklist,
  buildShiftHandoverFields,
  formatAlertHandoverLine,
} from "@/lib/shift-handover";
import {
  getReportTemplate,
  defaultReportTitle,
  validateReportFields,
} from "@/lib/report-templates";
import { snapshotFromAlert } from "@/lib/report-document";
import { useReportsStore } from "@/stores/reports-store";
import { toast } from "@/components/ui/use-toast";

type ShiftHandoverModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleAlerts: AlertAgendaItem[];
  preparedBy: string;
  authorRole?: UserRole;
};

const SEVERITY_BADGE = {
  critical: "danger" as const,
  warning: "warning" as const,
  info: "secondary" as const,
};

function ReadonlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1.5 text-muted-foreground">
        <Lock className="h-3 w-3" />
        {label}
      </Label>
      <div className="rounded-md border border-border/50 bg-muted/25 px-3 py-2.5 text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground/90 max-h-40 overflow-y-auto">
        {value.trim() || "—"}
      </div>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ShiftHandoverModal({
  open,
  onOpenChange,
  roleAlerts,
  preparedBy,
  authorRole,
}: ShiftHandoverModalProps) {
  const router = useRouter();
  const createDocument = useReportsStore((s) => s.createDocument);
  const template = getReportTemplate("shift");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fields, setFields] = useState<Record<string, string>>({});
  const [checklist, setChecklist] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const selectedAlerts = useMemo(
    () => roleAlerts.filter((a) => selectedIds.has(a.id)),
    [roleAlerts, selectedIds],
  );

  function mergeFields(
    selected: AlertAgendaItem[],
    prev: Record<string, string>,
    checklistIds: Set<string>,
  ) {
    return buildShiftHandoverFields(selected, {
      preparedBy: prev.preparedBy || preparedBy,
      incomingShift: prev.incomingShift,
      plantStatus: prev.plantStatus,
      shiftWalkthrough: prev.shiftWalkthrough,
      prioritiesNextShift: prev.prioritiesNextShift,
      additionalNotes: prev.additionalNotes,
      readinessChecklist: buildReadinessChecklist([...checklistIds]),
    });
  }

  useEffect(() => {
    if (!open) return;
    const allIds = new Set(roleAlerts.map((a) => a.id));
    const defaultChecklist = new Set(
      SHIFT_HANDOVER_CHECKLIST.slice(0, 3).map((c) => c.id),
    );
    setSelectedIds(allIds);
    setChecklist(defaultChecklist);
    setFields(
      buildShiftHandoverFields(roleAlerts, {
        preparedBy,
        readinessChecklist: buildReadinessChecklist([...defaultChecklist]),
      }),
    );
  }, [open, roleAlerts, preparedBy]);

  function applySelection(ids: Set<string>) {
    setSelectedIds(ids);
    const selected = roleAlerts.filter((a) => ids.has(a.id));
    setFields((prev) => mergeFields(selected, prev, checklist));
  }

  function toggleAlert(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    applySelection(next);
  }

  function toggleChecklist(id: string) {
    const next = new Set(checklist);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecklist(next);
    setFields((prev) =>
      mergeFields(
        roleAlerts.filter((a) => selectedIds.has(a.id)),
        prev,
        next,
      ),
    );
  }

  function updateField(id: string, value: string) {
    setFields((prev) => ({ ...prev, [id]: value }));
  }

  function renderField(fieldId: string, label: string, required?: boolean) {
    if (SHIFT_READONLY_FIELDS.has(fieldId)) {
      const hints: Record<string, string> = {
        alarmsSummary: "Counts and severity from selected alerts",
        openAlerts: "Mirrors alarm selection — not editable",
        pendingActions: "Open playbook checklist items from alerts",
        batchStatus: "Active fermenter from batch workspace",
      };
      return (
        <ReadonlyField
          key={fieldId}
          label={label}
          value={fields[fieldId] ?? ""}
          hint={hints[fieldId]}
        />
      );
    }

    if (fieldId === "incomingShift") {
      return (
        <div key={fieldId} className="space-y-1.5">
          <Label htmlFor="sho-incomingShift" className="text-xs">
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <select
            id="sho-incomingShift"
            value={fields.incomingShift ?? ""}
            onChange={(e) => updateField("incomingShift", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {SHIFT_BAND_OPTIONS.map((band) => (
              <option key={band} value={band}>
                {band}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (fieldId === "outgoingShift") {
      return (
        <ReadonlyField
          key={fieldId}
          label={label}
          value={fields.outgoingShift ?? ""}
          hint="Auto from current time"
        />
      );
    }

    if (fieldId === "readinessChecklist") {
      return (
        <div key={fieldId} className="space-y-2">
          <Label className="text-xs">{label}</Label>
          <div className="space-y-1.5 rounded-lg border border-border/60 p-3">
            {SHIFT_HANDOVER_CHECKLIST.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 text-xs cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checklist.has(item.id)}
                  onChange={() => toggleChecklist(item.id)}
                />
                {item.label}
              </label>
            ))}
          </div>
          {fields.readinessChecklist && (
            <div className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">
              {fields.readinessChecklist}
            </div>
          )}
        </div>
      );
    }

    const isTextarea =
      fieldId === "plantStatus" ||
      fieldId === "shiftWalkthrough" ||
      fieldId === "prioritiesNextShift" ||
      fieldId === "additionalNotes";

    const placeholders: Record<string, string> = {
      plantStatus: "e.g. Full rate on F1/F2, steam header stable, 2 operators on floor",
      shiftWalkthrough: "Cooling trim on LOT-2847, lab row late 40h quality…",
      prioritiesNextShift: "1. Close fermenter cooling loop 2. Post 50hr sample 3. …",
      additionalNotes: "Maintenance on agitator AM — coordinate with control room",
    };

    return (
      <div key={fieldId} className="space-y-1.5">
        <Label htmlFor={`sho-${fieldId}`} className="text-xs">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {isTextarea ? (
          <textarea
            id={`sho-${fieldId}`}
            value={fields[fieldId] ?? ""}
            onChange={(e) => updateField(fieldId, e.target.value)}
            placeholder={placeholders[fieldId]}
            rows={fieldId === "prioritiesNextShift" ? 4 : 3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed"
          />
        ) : (
          <Input
            id={`sho-${fieldId}`}
            value={fields[fieldId] ?? ""}
            onChange={(e) => updateField(fieldId, e.target.value)}
          />
        )}
      </div>
    );
  }

  function handleSave() {
    const error = validateReportFields("shift", fields);
    if (error) {
      toast({ title: "Missing required fields", description: error });
      return;
    }
    if (selectedAlerts.length === 0) {
      toast({
        title: "Select at least one alert",
        description: "Shift handover must include alerts for your role.",
      });
      return;
    }

    setSaving(true);
    try {
      const id = createDocument({
        templateId: "shift",
        title: defaultReportTitle("shift"),
        createdBy: preparedBy,
        author: fields.preparedBy?.trim() || preparedBy,
        authorRole,
        fields,
        linkedAlerts: selectedAlerts.map(snapshotFromAlert),
      });
      toast({
        title: "Shift handover saved",
        description: `${selectedAlerts.length} alert(s) linked · open alerts synced to selection.`,
      });
      onOpenChange(false);
      router.push(`/reports?id=${id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileBarChart className="h-5 w-5 text-primary" />
            Shift handover
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-left">
            DOR-style pack — select alerts (open alerts sync automatically), complete
            plant status and priorities, then save.
          </p>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 overflow-hidden min-h-0 flex-1">
          <div className="overflow-y-auto px-6 py-5 border-b lg:border-b-0 lg:border-r border-border/60 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Alarms — {selectedIds.size}/{roleAlerts.length} selected
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => applySelection(new Set(roleAlerts.map((a) => a.id)))}
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => applySelection(new Set())}
                >
                  None
                </Button>
              </div>
            </div>

            {roleAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center">
                No alerts on today&apos;s agenda for your role.
              </p>
            ) : (
              <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {roleAlerts.map((a) => {
                  const checked = selectedIds.has(a.id);
                  return (
                    <li key={a.id}>
                      <label
                        className={cn(
                          "flex gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors",
                          checked
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/60 hover:border-border",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAlert(a.id)}
                          className="mt-1 shrink-0"
                        />
                        <span className="min-w-0 flex-1 space-y-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={SEVERITY_BADGE[a.severity]}
                              className="text-[9px]"
                            >
                              {a.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">
                              {a.lifecycle}
                            </span>
                          </span>
                          <span className="text-sm font-medium block truncate">
                            {a.playbookName}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {formatAlertHandoverLine(a).replace(/^•\s*/, "")}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="overflow-y-auto px-6 py-5 space-y-5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Preview — edit operator fields before save
            </Label>
            {template.sections.map((section) => (
              <div key={section.title} className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">{section.title}</p>
                  {section.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {section.description}
                    </p>
                  )}
                </div>
                {section.fields.map((field) =>
                  renderField(field.id, field.label, field.required),
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            Save shift handover
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
