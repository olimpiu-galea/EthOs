"use client";

import { useMemo, useState } from "react";
import { DEFAULT_COMPANY, INDUSTRY_DOMAINS } from "@/lib/auth-constants";
import { domainAccentLabel } from "@/lib/domain-config";
import { resetLakeviewWorkspace } from "@/lib/reset-lakeview-workspace";
import { useSettingsStore } from "@/stores/settings-store";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import type { ReportTemplateId } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const TEMPLATE_LABELS: Partial<Record<ReportTemplateId, string>> = {
  dor: "Daily Operations Report (DOR)",
};

export function SettingsGeneralPanel() {
  const companyId = useSettingsStore((s) => s.companyId);
  const companyName = useSettingsStore((s) => s.companyName);
  const domain = useSettingsStore((s) => s.domain);
  const [resetting, setResetting] = useState(false);
  const reportTemplates = useSettingsStore((s) => s.reportTemplates);
  const setCompanyName = useSettingsStore((s) => s.setCompanyName);
  const toggleReportTemplate = useSettingsStore((s) => s.toggleReportTemplate);

  const currentDomain = useMemo(
    () => INDUSTRY_DOMAINS.find((d) => d.id === domain),
    [domain],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
          <CardDescription>
            Workspace display name for reports and the sidebar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company name</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Industry domain</CardTitle>
          <CardDescription>
            Selected when the account was created. Platform admins can change
            this per company on the Companies tab.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="font-medium">
              {currentDomain?.label ?? domainAccentLabel(domain)}
            </p>
            {currentDomain?.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {currentDomain.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {companyId === DEFAULT_COMPANY.id && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Reset demo workspace</CardTitle>
            <CardDescription>
              Clear all playbooks, agenda alerts, reports, integrations, and
              custom settings for Lakeview Energy. Demo playbooks are recreated
              automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={resetting}
              onClick={async () => {
                setResetting(true);
                try {
                  await resetLakeviewWorkspace();
                } finally {
                  setResetting(false);
                }
              }}
            >
              <RotateCcw className="h-4 w-4" />
              {resetting ? "Resetting…" : "Reset Lakeview to defaults"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report templates</CardTitle>
          <CardDescription>
            Choose which document types appear on Reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reportTemplates
            .filter((t) => t.id === "dor")
            .map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <span className="text-sm font-medium">
                  {TEMPLATE_LABELS[t.id] ?? t.id}
                </span>
                <Switch
                  checked={t.enabled}
                  onCheckedChange={() => toggleReportTemplate(t.id)}
                />
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
