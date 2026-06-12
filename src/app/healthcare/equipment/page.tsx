"use client";

import { Stethoscope } from "lucide-react";
import { HealthcarePageShell } from "@/components/healthcare/healthcare-page-shell";

export default function EquipmentPage() {
  return (
    <HealthcarePageShell
      icon={Stethoscope}
      title="Equipment Monitor"
      description="Critical device uptime, utilization, and maintenance signals — preview layout for biomedical engineering."
      sections={[
        {
          title: "Device fleet",
          rows: ["MRI suite", "CT scanner", "Ventilator bank", "Sterilizer line"],
        },
        {
          title: "Maintenance",
          rows: ["PM due this week", "Open work orders", "Uptime (30d)"],
        },
      ]}
    />
  );
}
