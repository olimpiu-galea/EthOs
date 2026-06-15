"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  Link2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useReportsStore } from "@/stores/reports-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useAuthStore } from "@/stores/auth-store";
import { useAlertHistoryStore } from "@/stores/alert-history-store";
import type { ReportTemplateId } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/auth-constants";
import { REPORT_TEMPLATES } from "@/lib/report-templates";
import { formatReportDate, normalizeReportDocument } from "@/lib/report-document";
import { agendaTodayKey, dateKeyFromTimestamp } from "@/lib/agenda-time";
import { AgendaDatePicker } from "@/components/agenda/agenda-date-picker";
import { CreateReportModal } from "@/components/reports/create-report-modal";
import { UploadTemplateModal } from "@/components/reports/upload-template-modal";
import { ReportDocumentView } from "@/components/reports/report-document-view";
import { cn } from "@/lib/utils";

export function ReportsHubFunctional() {
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const companyName = useSettingsStore((s) => s.companyName);
  const reportTemplates = useSettingsStore((s) => s.reportTemplates);
  const documents = useReportsStore((s) => s.documents);
  const hasHydrated = useReportsStore((s) => s._hasHydrated);
  const deleteDocument = useReportsStore((s) => s.deleteDocument);
  const agendaItems = useAlertHistoryStore((s) => s.items);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadTemplateOpen, setUploadTemplateOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const todayKey = agendaTodayKey();
  const [dayFilter, setDayFilter] = useState(todayKey);

  useEffect(() => {
    if (useReportsStore.persist.hasHydrated()) {
      useReportsStore.getState().setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    setSelectedDocId(id);
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      setDayFilter(dateKeyFromTimestamp(doc.createdAt));
    }
  }, [searchParams, documents]);

  const enabledTemplateIds = reportTemplates
    .filter((t) => t.enabled)
    .map((t) => t.id);

  const recentAlerts = useMemo(() => {
    return [...agendaItems]
      .sort((a, b) => b.triggeredAt - a.triggeredAt)
      .slice(0, 20);
  }, [agendaItems]);

  const normalizedDocs = useMemo(
    () => documents.map((d) => normalizeReportDocument(d)),
    [documents],
  );

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normalizedDocs
      .filter((d) => dateKeyFromTimestamp(d.createdAt) === dayFilter)
      .filter((d) => {
        if (!q) return true;
        const tpl = REPORT_TEMPLATES[d.templateId];
        return (
          d.title.toLowerCase().includes(q) ||
          d.author.toLowerCase().includes(q) ||
          d.createdBy.toLowerCase().includes(q) ||
          tpl.name.toLowerCase().includes(q) ||
          tpl.abbr.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [normalizedDocs, search, dayFilter]);

  useEffect(() => {
    if (
      selectedDocId &&
      !filteredDocs.some((d) => d.id === selectedDocId)
    ) {
      setSelectedDocId(null);
    }
  }, [filteredDocs, selectedDocId]);

  const selectedDoc = normalizedDocs.find((d) => d.id === selectedDocId) ?? null;

  const stats = useMemo(() => {
    const withAlerts = normalizedDocs.filter(
      (d) => d.linkedAlerts.length > 0,
    ).length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = normalizedDocs.filter((d) => d.createdAt >= weekAgo).length;
    return { total: normalizedDocs.length, withAlerts, thisWeek };
  }, [normalizedDocs]);

  function handleCreated(id: string) {
    setSelectedDocId(id);
  }

  return (
    <div className="p-8 max-lg:p-4 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          </div>
          <p className="text-muted-foreground max-w-xl">
            Operations documents for {companyName}. Create from templates,
            complete fields, and attach agenda alerts with full context saved on
            the record.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() => setUploadTemplateOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload as template
          </Button>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => setCreateOpen(true)}
            disabled={enabledTemplateIds.length === 0}
          >
            <Plus className="h-4 w-4" />
            Create report
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold tabular-nums">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold tabular-nums">{stats.thisWeek}</p>
            <p className="text-sm text-muted-foreground">Created this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold tabular-nums">{stats.withAlerts}</p>
            <p className="text-sm text-muted-foreground">With linked alerts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Existing reports</CardTitle>
                <CardDescription>
                  {filteredDocs.length} document
                  {filteredDocs.length !== 1 ? "s" : ""}
                  {dayFilter === todayKey ? " · today" : ` · ${dayFilter}`}
                </CardDescription>
              </div>
            </div>
            <AgendaDatePicker
              value={dayFilter}
              todayKey={todayKey}
              onChange={setDayFilter}
              className="mt-3"
            />
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, type, author…"
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[520px] overflow-y-auto">
            {!hasHydrated ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Loading reports…
              </p>
            ) : filteredDocs.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "No reports match your search on this day."
                    : dayFilter === todayKey
                      ? "No reports filed today."
                      : `No reports on ${dayFilter}.`}
                </p>
                {!search && dayFilter === todayKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Create report
                  </Button>
                )}
              </div>
            ) : (
              filteredDocs.map((d) => {
                const tpl = REPORT_TEMPLATES[d.templateId];
                const active = selectedDocId === d.id;
                return (
                  <div
                    key={d.id}
                    className={cn(
                      "group rounded-lg border transition-colors",
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30",
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3"
                      onClick={() => setSelectedDocId(d.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm truncate pr-2">
                          {d.title}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono shrink-0"
                        >
                          {tpl.abbr}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tpl.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        <span>{formatReportDate(d.createdAt)}</span>
                        <span>·</span>
                        <span>
                          {d.createdBy}
                          {d.authorRole
                            ? ` · ${ROLE_LABELS[d.authorRole]}`
                            : ""}
                        </span>
                        {d.linkedAlerts.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 text-primary">
                              <Link2 className="h-3 w-3" />
                              {d.linkedAlerts.length} alert
                              {d.linkedAlerts.length !== 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                    <div className="flex justify-end px-2 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          deleteDocument(d.id);
                          if (selectedDocId === d.id) setSelectedDocId(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="xl:col-span-7 space-y-4">
          {selectedDoc ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Document preview
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground"
                  onClick={() => setSelectedDocId(null)}
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>
              <ReportDocumentView document={selectedDoc} />
            </>
          ) : (
            <Card className="min-h-[520px] flex flex-col">
              <CardContent className="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="rounded-full bg-muted/40 p-5 mb-5">
                  <FileText className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold">Select a report</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Choose an existing document from the list, or create a new one
                  from a template with live preview and optional alert linking.
                </p>
                <Button
                  className="mt-6 gap-2"
                  onClick={() => setCreateOpen(true)}
                  disabled={enabledTemplateIds.length === 0}
                >
                  <Plus className="h-4 w-4" />
                  Create report
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <UploadTemplateModal
        open={uploadTemplateOpen}
        onOpenChange={setUploadTemplateOpen}
      />

      <CreateReportModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        enabledTemplateIds={enabledTemplateIds as ReportTemplateId[]}
        alerts={recentAlerts}
        createdBy={user?.name ?? "Operator"}
        onCreated={handleCreated}
      />
    </div>
  );
}
