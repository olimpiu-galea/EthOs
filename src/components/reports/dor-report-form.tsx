"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Factory, FileSpreadsheet, LayoutGrid } from "lucide-react";
import type { ReportSectionDef } from "@/lib/report-templates";
import {
  DOR_TABS,
  dorSectionsForTab,
  isWorkbookTextSection,
  layoutDorMetricSection,
} from "@/lib/dor-field-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TAB_ICONS = {
  header: LayoutGrid,
  production: Factory,
  workbook: FileSpreadsheet,
  alerts: ClipboardList,
} as const;

type DorReportFormProps = {
  sections: ReportSectionDef[];
  fields: Record<string, string>;
  onFieldChange: (id: string, value: string) => void;
};

function FieldInput({
  id,
  type,
  value,
  onChange,
  className,
  placeholder = "",
  rows,
}: {
  id: string;
  type: "text" | "textarea" | "date";
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
}) {
  if (type === "textarea") {
    return (
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 10}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed",
          "placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "resize-y",
          className,
        )}
      />
    );
  }
  return (
    <Input
      id={id}
      type={type === "date" ? "date" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("h-9 bg-background tabular-nums", className)}
    />
  );
}

function MetricSectionTable({
  section,
  fields,
  onFieldChange,
}: {
  section: ReportSectionDef;
  fields: Record<string, string>;
  onFieldChange: (id: string, value: string) => void;
}) {
  const layout = useMemo(
    () => layoutDorMetricSection(section.fields),
    [section.fields],
  );

  if (layout.columns.length === 0) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {section.fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs text-muted-foreground">
              {field.label}
            </Label>
            <FieldInput
              id={field.id}
              type={field.type}
              value={fields[field.id] ?? ""}
              onChange={(v) => onFieldChange(field.id, v)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 overflow-hidden bg-card/50 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm border-collapse">
            <thead>
              <tr className="bg-muted/60 border-b border-border/60">
                <th className="sticky left-0 z-10 bg-muted/60 text-left px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-[120px]">
                  Line
                </th>
                {layout.columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground min-w-[88px]"
                  >
                    <span className="block text-primary/80">{col.period}</span>
                    <span className="block font-normal normal-case text-[11px] text-foreground/80 mt-0.5">
                      {col.metric}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {layout.rows.map((row, idx) => (
                <tr
                  key={row.line}
                  className={cn(
                    "border-b border-border/40 last:border-0",
                    idx % 2 === 0 ? "bg-background/40" : "bg-muted/15",
                  )}
                >
                  <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-medium text-xs whitespace-nowrap">
                    {row.line}
                  </td>
                  {layout.columns.map((col) => {
                    const cell = row.cells[col.key];
                    return (
                      <td key={col.key} className="px-1.5 py-1.5">
                        {cell ? (
                          <FieldInput
                            id={cell.fieldId}
                            type="text"
                            value={fields[cell.fieldId] ?? ""}
                            onChange={(v) => onFieldChange(cell.fieldId, v)}
                            className="h-8 text-center text-xs"
                          />
                        ) : (
                          <div className="h-8 rounded-md bg-muted/25" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {layout.yields.length > 0 && (
        <div className="rounded-xl border border-border/70 overflow-hidden bg-card/40 shadow-sm">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide bg-muted/50 border-b">
            Yields
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/25">
                <th className="text-left px-3 py-2 text-xs text-muted-foreground">
                  Metric
                </th>
                <th className="px-2 py-2 text-xs text-muted-foreground">Daily</th>
                <th className="px-2 py-2 text-xs text-muted-foreground">MTD</th>
                <th className="px-2 py-2 text-xs text-muted-foreground">YTD</th>
              </tr>
            </thead>
            <tbody>
              {layout.yields.map((y) => (
                <tr key={y.label} className="border-b border-border/30 last:border-0">
                  <td className="px-3 py-2 font-medium text-xs">{y.label}</td>
                  {([y.dailyId, y.mtdId, y.ytdId] as const).map((fid) => (
                    <td key={fid ?? y.label} className="px-2 py-1.5">
                      {fid ? (
                        <FieldInput
                          id={fid}
                          type="text"
                          value={fields[fid] ?? ""}
                          onChange={(v) => onFieldChange(fid, v)}
                          className="h-8 text-xs"
                        />
                      ) : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {layout.loose.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {layout.loose.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.id} className="text-xs text-muted-foreground">
                {field.label}
              </Label>
              <FieldInput
                id={field.id}
                type={field.type}
                value={fields[field.id] ?? ""}
                onChange={(v) => onFieldChange(field.id, v)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkbookGrid({
  sections,
  fields,
  onFieldChange,
}: {
  sections: ReportSectionDef[];
  fields: Record<string, string>;
  onFieldChange: (id: string, value: string) => void;
}) {
  const sheets = sections.filter(isWorkbookTextSection);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sheets.map((section) => {
        const field = section.fields[0];
        return (
          <div
            key={section.title}
            className="flex flex-col rounded-xl border border-border/70 bg-card/40 shadow-sm overflow-hidden min-h-[200px]"
          >
            <div className="px-3 py-2.5 border-b bg-muted/40 shrink-0">
              <p className="text-xs font-semibold tracking-tight">{section.title}</p>
              {section.description && (
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                  {section.description}
                </p>
              )}
            </div>
            <div className="p-2 flex-1 min-h-0">
              <FieldInput
                id={field.id}
                type="textarea"
                value={fields[field.id] ?? ""}
                onChange={(v) => onFieldChange(field.id, v)}
                placeholder="Paste or type…"
                rows={8}
                className="min-h-[140px] text-xs border-0 bg-transparent focus-visible:ring-1"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DorReportForm({
  sections,
  fields,
  onFieldChange,
}: DorReportFormProps) {
  const [activeTab, setActiveTab] = useState(DOR_TABS[0].id);
  const [productionSection, setProductionSection] = useState(
    DOR_TABS.find((t) => t.id === "production")!.sectionTitles[0],
  );

  const tabSections = dorSectionsForTab(sections, activeTab);
  const productionSections = dorSectionsForTab(sections, "production");

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex flex-wrap gap-1 border-b border-border/60 pb-0 shrink-0 -mx-1">
        {DOR_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id as keyof typeof TAB_ICONS];
          const active = activeTab === tab.id;
          const count = dorSectionsForTab(sections, tab.id).reduce(
            (n, s) => n + s.fields.length,
            0,
          );
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors border border-b-0 -mb-px",
                active
                  ? "bg-background border-border/80 text-foreground shadow-sm"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30",
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" />}
              {tab.label}
              <span
                className={cn(
                  "text-[10px] font-mono rounded px-1.5 py-0.5",
                  active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto py-5 pr-2 min-h-0">
        {activeTab === "production" && productionSections.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-5 p-1 rounded-lg bg-muted/25 border border-border/40">
            {productionSections.map((s) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setProductionSection(s.title)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  productionSection === s.title
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background hover:text-foreground",
                )}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}

        {activeTab === "workbook" ? (
          <WorkbookGrid
            sections={tabSections}
            fields={fields}
            onFieldChange={onFieldChange}
          />
        ) : (
          <div className="space-y-6">
            {(activeTab === "production"
              ? tabSections.filter((s) => s.title === productionSection)
              : tabSections
            ).map((section) => (
              <section key={section.title} className="space-y-4">
                {activeTab !== "header" && (
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/60" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                      {section.title}
                    </h3>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                )}

                {activeTab === "header" && (
                  <div className="rounded-xl border border-border/70 bg-card/40 p-5 shadow-sm">
                    <p className="text-sm font-semibold mb-4">Report cover</p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {section.fields.map((field) => (
                        <div key={field.id} className="space-y-1.5">
                          <Label htmlFor={field.id} className="text-xs">
                            {field.label}
                          </Label>
                          <FieldInput
                            id={field.id}
                            type={field.type}
                            value={fields[field.id] ?? ""}
                            onChange={(v) => onFieldChange(field.id, v)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "production" && (
                  <MetricSectionTable
                    section={section}
                    fields={fields}
                    onFieldChange={onFieldChange}
                  />
                )}

                {activeTab === "alerts" && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {section.fields.map((field) => (
                      <div
                        key={field.id}
                        className={cn(
                          "space-y-2 rounded-xl border border-border/70 bg-card/40 p-4 shadow-sm",
                          field.id === "openAlerts" && "lg:col-span-2",
                        )}
                      >
                        <Label htmlFor={field.id} className="text-sm font-medium">
                          {field.label}
                        </Label>
                        <FieldInput
                          id={field.id}
                          type={field.type}
                          value={fields[field.id] ?? ""}
                          onChange={(v) => onFieldChange(field.id, v)}
                          rows={field.type === "textarea" ? 6 : undefined}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
