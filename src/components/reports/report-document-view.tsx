"use client";

import {
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
  Link2,
  User,
} from "lucide-react";
import type { ReportDocument } from "@/lib/types";
import { getReportTemplate } from "@/lib/report-templates";
import {
  fieldDisplayValue,
  formatAlertTime,
  formatReportDate,
  isLegacyReport,
} from "@/lib/report-document";
import { CommoditySnapshotPanel } from "@/components/reports/commodity-snapshot-panel";
import { ROLE_LABELS } from "@/lib/auth-constants";
import { useSettingsStore } from "@/stores/settings-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SEVERITY_CLASS = {
  critical: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  info: "border-primary/40 bg-primary/10 text-primary",
};

type ReportDocumentViewProps = {
  document: ReportDocument;
  className?: string;
};

export function ReportDocumentView({
  document: doc,
  className,
}: ReportDocumentViewProps) {
  const companyName = useSettingsStore((s) => s.companyName);
  const template = getReportTemplate(doc.templateId);
  const legacy = isLegacyReport(doc);

  if (legacy && doc.content) {
    return (
      <div className={cn("rounded-xl border bg-card", className)}>
        <div className="border-b px-6 py-5 space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Legacy document
          </p>
          <h2 className="text-xl font-semibold">{doc.title}</h2>
        </div>
        <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground leading-relaxed p-6">
          {doc.content}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm overflow-hidden",
        className,
      )}
    >
      <div className="border-b bg-muted/20 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              {companyName}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{doc.title}</h2>
            <p className="text-sm text-muted-foreground">{template.name}</p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {template.abbr}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatReportDate(doc.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Created by {doc.createdBy}
            {doc.authorRole && (
              <span className="text-muted-foreground/80">
                · {ROLE_LABELS[doc.authorRole]}
              </span>
            )}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {template.cadence}
          </span>
        </div>
      </div>

      <div className="px-6 py-6 space-y-8">
        {template.sections.map((section) => (
          <section key={section.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border/60 pb-2 mb-4">
              {section.title}
            </h3>
            {section.description && (
              <p className="text-xs text-muted-foreground mb-4">
                {section.description}
              </p>
            )}
            <dl className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => {
                const raw = doc.fields[field.id] ?? "";
                const display = fieldDisplayValue(
                  doc.templateId,
                  field.id,
                  raw,
                );
                const isEmpty = !raw.trim();
                const isLong = field.type === "textarea";

                return (
                  <div
                    key={field.id}
                    className={cn(isLong && "sm:col-span-2")}
                  >
                    <dt className="text-xs font-medium text-muted-foreground mb-1">
                      {field.label}
                    </dt>
                    <dd
                      className={cn(
                        "text-sm rounded-lg border px-3 py-2.5 min-h-[2.5rem]",
                        isEmpty
                          ? "border-dashed text-muted-foreground/60 italic"
                          : "border-border/60 bg-muted/10 text-foreground",
                        isLong && "whitespace-pre-wrap leading-relaxed",
                      )}
                    >
                      {display}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}

        {doc.commoditySnapshot && doc.commoditySnapshot.length > 0 && (
          <section className="border-t border-border/60 pt-8">
            <CommoditySnapshotPanel snapshot={doc.commoditySnapshot} />
          </section>
        )}

        <section className="border-t border-border/60 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Alerts linked
            </h3>
            <Badge variant="secondary" className="text-[10px] ml-auto">
              {doc.linkedAlerts.length}
            </Badge>
          </div>

          {doc.linkedAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center">
              No alerts linked to this document.
            </p>
          ) : (
            <div className="space-y-3">
              {doc.linkedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "rounded-lg border p-4 space-y-2",
                    SEVERITY_CLASS[alert.severity],
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="font-semibold text-sm">
                      {alert.alertTitle}
                    </span>
                    <Badge variant="outline" className="text-[9px] capitalize">
                      {alert.severity}
                    </Badge>
                    {(alert.teamName || alert.teamId) && (
                      <Badge variant="outline" className="text-[9px]">
                        {alert.teamName ?? alert.teamId}
                      </Badge>
                    )}
                    <span className="text-xs opacity-80 ml-auto tabular-nums">
                      {formatAlertTime(alert.triggeredAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{alert.playbookName}</p>
                  <p className="text-sm opacity-90">{alert.alertMessage}</p>
                  <p className="text-xs opacity-75 font-mono">
                    Conditions: {alert.conditionsSummary}
                  </p>
                  <p className="text-xs opacity-75 capitalize">
                    Status at save: {alert.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
