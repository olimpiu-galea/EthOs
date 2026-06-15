"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  FileText,
  Link2,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AlertAgendaItem, ReportTemplateId } from "@/lib/types";
import {
  REPORT_TEMPLATES,
  defaultReportTitle,
  emptyFieldsForTemplate,
  validateReportFields,
} from "@/lib/report-templates";
import { AlertLinkMultiSelect } from "@/components/reports/alert-link-multi-select";
import { DorReportForm } from "@/components/reports/dor-report-form";
import { fieldDisplayValue, snapshotFromAlert } from "@/lib/report-document";
import {
  buildCommoditySnapshot,
  prefillFinancialReportFields,
} from "@/lib/commodity-signals";
import { CommoditySnapshotPanel } from "@/components/reports/commodity-snapshot-panel";
import { useSettingsStore } from "@/stores/settings-store";
import { useReportsStore } from "@/stores/reports-store";
import { useCommodityStore } from "@/stores/commodity-store";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/components/ui/use-toast";

type CreateReportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabledTemplateIds: ReportTemplateId[];
  alerts: AlertAgendaItem[];
  createdBy: string;
  onCreated: (documentId: string) => void;
};

function ReportTypeSelect({
  templateId,
  enabledTemplateIds,
  onSelect,
}: {
  templateId: ReportTemplateId;
  enabledTemplateIds: ReportTemplateId[];
  onSelect: (id: ReportTemplateId) => void;
}) {
  const template = REPORT_TEMPLATES[templateId];

  return (
    <div className="space-y-1.5">
      <Label htmlFor="report-template" className="text-sm font-medium">
        Document type
      </Label>
      <Select
        value={templateId}
        onValueChange={(v) => onSelect(v as ReportTemplateId)}
      >
        <SelectTrigger
          id="report-template"
          className="h-10 w-full items-center rounded-md px-3"
        >
          <SelectValue className="sr-only">{template.name}</SelectValue>
          <div className="flex flex-1 items-center gap-2 min-w-0 pr-1 text-left">
            <span className="text-sm font-medium truncate">{template.name}</span>
            <Badge
              variant="outline"
              className="text-[9px] font-mono shrink-0 h-5 px-1.5"
            >
              {template.abbr}
            </Badge>
          </div>
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="rounded-lg p-1 max-h-[min(16rem,45vh)]"
        >
          {enabledTemplateIds.map((id) => {
            const meta = REPORT_TEMPLATES[id];
            return (
              <SelectItem
                key={id}
                value={id}
                className="rounded-md py-0 pl-8 pr-2"
              >
                <div className="flex flex-col gap-0.5 py-2 w-full min-w-0 max-w-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      {meta.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono shrink-0"
                    >
                      {meta.abbr}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {meta.description}
                  </p>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CreateReportModal({
  open,
  onOpenChange,
  enabledTemplateIds,
  alerts,
  createdBy,
  onCreated,
}: CreateReportModalProps) {
  const companyName = useSettingsStore((s) => s.companyName);
  const user = useAuthStore((s) => s.user);
  const createDocument = useReportsStore((s) => s.createDocument);
  const commodityConnected = useCommodityStore((s) => s.connected);
  const commodityTags = useCommodityStore((s) => s.tags);

  const [templateId, setTemplateId] = useState<ReportTemplateId>(
    enabledTemplateIds[0] ?? "dor",
  );
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [linkedAlertIds, setLinkedAlertIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const template = REPORT_TEMPLATES[templateId];
  const liveCommoditySnapshot = useMemo(() => {
    if (!commodityConnected || commodityTags.length === 0) return [];
    return buildCommoditySnapshot(commodityTags);
  }, [commodityConnected, commodityTags]);
  const linkedAlerts = useMemo(
    () => alerts.filter((a) => linkedAlertIds.has(a.id)),
    [alerts, linkedAlertIds],
  );

  function fieldsForTemplate(id: ReportTemplateId): Record<string, string> {
    const base = emptyFieldsForTemplate(id);
    const withAuthor = {
      ...base,
      ...(base.author !== undefined
        ? { author: createdBy }
        : {}),
    };
    if (
      id === "financial" &&
      commodityConnected &&
      commodityTags.length > 0
    ) {
      return {
        ...withAuthor,
        ...prefillFinancialReportFields(commodityTags),
        author: createdBy,
      };
    }
    return withAuthor;
  }

  useEffect(() => {
    if (!open) return;
    const first = enabledTemplateIds[0] ?? "dor";
    setTemplateId(first);
    setFields(fieldsForTemplate(first));
    setTitle(defaultReportTitle(first));
    setLinkedAlertIds(new Set());
  }, [open, enabledTemplateIds, commodityConnected, companyName, createdBy]);

  function selectTemplate(id: ReportTemplateId) {
    setTemplateId(id);
    setFields(fieldsForTemplate(id));
    setTitle(defaultReportTitle(id));
  }

  function updateField(id: string, value: string) {
    setFields((prev) => ({ ...prev, [id]: value }));
  }

  function handleSave() {
    const error = validateReportFields(templateId, fields);
    if (error) {
      toast({ title: "Missing required fields", description: error });
      return;
    }

    setSaving(true);
    try {
      const linkedAlertSnapshots = linkedAlerts.map(snapshotFromAlert);
      const commoditySnapshot =
        templateId === "financial" && liveCommoditySnapshot.length > 0
          ? liveCommoditySnapshot
          : undefined;
      const id = createDocument({
        templateId,
        title,
        createdBy,
        author: createdBy,
        authorRole: user?.role,
        fields,
        linkedAlerts: linkedAlertSnapshots,
        commoditySnapshot,
      });
      toast({
        title: "Report saved",
        description:
          linkedAlertSnapshots.length > 0
            ? `${template.abbr} saved with ${linkedAlertSnapshots.length} linked alert(s).`
            : `${template.abbr} document created successfully.`,
      });
      onCreated(id);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  const isDor = templateId === "dor";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 flex flex-col",
          isDor
            ? "max-w-[min(1400px,96vw)] w-[96vw] h-[92vh] max-h-[92vh] overflow-hidden"
            : "max-w-5xl max-h-[90vh]",
        )}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Create report
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-left">
            {template.description}
          </p>
        </DialogHeader>

        <div className="px-6 py-4 border-b border-border/50 bg-muted/10 shrink-0">
          <div className="grid gap-4 lg:grid-cols-3">
            <ReportTypeSelect
              templateId={templateId}
              enabledTemplateIds={enabledTemplateIds}
              onSelect={selectTemplate}
            />
            <div className="space-y-1.5">
              <Label htmlFor="report-title">Document title</Label>
              <Input
                id="report-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={defaultReportTitle(templateId)}
              />
            </div>
            <AlertLinkMultiSelect
              alerts={alerts}
              selectedIds={linkedAlertIds}
              onChange={setLinkedAlertIds}
            />
          </div>
          {isDor && (
            <p className="text-xs text-muted-foreground mt-3">
              {companyName} · All values start empty — complete each tab below.
            </p>
          )}
        </div>

        {isDor ? (
          <div className="flex-1 min-h-0 px-6 flex flex-col overflow-hidden">
            <DorReportForm
              sections={template.sections}
              fields={fields}
              onFieldChange={updateField}
            />
          </div>
        ) : (
        <div className="grid lg:grid-cols-2 max-h-[calc(90vh-14rem)] overflow-hidden flex-1 min-h-0">
          <div className="overflow-y-auto px-6 py-5 space-y-6 border-b lg:border-b-0 lg:border-r border-border/60">
            {templateId === "financial" && commodityConnected && (
              <p className="text-xs text-primary/90 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
                Fields pre-filled from live Financial feed. A signal snapshot
                will be saved with the document.
              </p>
            )}
            {templateId === "financial" && !commodityConnected && (
              <p className="text-xs text-muted-foreground rounded-lg border border-dashed px-3 py-2">
                Connect Financial feed on Integrations to auto-fill this
                report and capture signals at save time.
              </p>
            )}

            {template.sections.map((section) => (
              <div key={section.title} className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">{section.title}</p>
                  {section.description && (
                    <p className="text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  )}
                </div>
                {section.fields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={field.id}>
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-0.5">*</span>
                      )}
                    </Label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={field.id}
                        value={fields[field.id] ?? ""}
                        onChange={(e) => updateField(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
                      />
                    ) : (
                      <Input
                        id={field.id}
                        type={field.type === "date" ? "date" : "text"}
                        value={fields[field.id] ?? ""}
                        onChange={(e) => updateField(field.id, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="overflow-y-auto bg-muted/15 px-6 py-5 space-y-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <ChevronRight className="h-3.5 w-3.5" />
              Live preview
            </div>

            <div className="rounded-xl border bg-card shadow-sm text-sm">
              <div className="border-b px-4 py-4 bg-muted/20">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {companyName}
                </p>
                <p className="font-bold text-base mt-1">
                  {title || defaultReportTitle(templateId)}
                </p>
                <p className="text-xs text-muted-foreground">{template.name}</p>
                <Badge variant="outline" className="mt-2 text-[9px] font-mono">
                  {template.abbr}
                </Badge>
              </div>

              <div className="px-4 py-4 space-y-5">
                {template.sections.map((section) => (
                  <div key={section.title}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider border-b pb-1 mb-2">
                      {section.title}
                    </p>
                    <div className="space-y-2">
                      {section.fields.map((field) => {
                        const raw = fields[field.id] ?? "";
                        const display = fieldDisplayValue(
                          templateId,
                          field.id,
                          raw,
                        );
                        return (
                          <div key={field.id}>
                            <p className="text-[10px] text-muted-foreground">
                              {field.label}
                            </p>
                            <p
                              className={cn(
                                "text-xs mt-0.5",
                                !raw.trim() && "text-muted-foreground/50 italic",
                              )}
                            >
                              {display}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {templateId === "financial" &&
                  liveCommoditySnapshot.length > 0 && (
                    <CommoditySnapshotPanel
                      snapshot={liveCommoditySnapshot}
                      compact
                      className="border-t pt-4"
                    />
                  )}

                <div className="border-t pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 mb-2">
                    <Link2 className="h-3 w-3" />
                    Alerts linked
                  </p>
                  {linkedAlerts.length > 0 ? (
                    <div className="space-y-2">
                      {linkedAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1"
                        >
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-medium text-xs">
                              {alert.alertTitle}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {alert.playbookName}
                          </p>
                          <p className="text-[11px] line-clamp-2">
                            {alert.alertMessage}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      None selected
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/10 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            Save report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
