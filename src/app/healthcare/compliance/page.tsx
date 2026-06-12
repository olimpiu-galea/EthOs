"use client";

import { ClipboardCheck } from "lucide-react";
import { HealthcarePageShell } from "@/components/healthcare/healthcare-page-shell";

export default function CompliancePage() {
  return (
    <HealthcarePageShell
      icon={ClipboardCheck}
      title="Compliance Dashboard"
      description="Incidents, audits, training, and regulatory flags — design shell for quality & risk teams."
      sections={[
        {
          title: "Regulatory",
          rows: ["Open incidents", "Audits scheduled", "HIPAA review queue"],
        },
        {
          title: "Training & variance",
          rows: ["Staff compliance %", "Medication variances", "Policy attestations"],
        },
      ]}
    />
  );
}
