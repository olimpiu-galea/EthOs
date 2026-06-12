"use client";

import { Users } from "lucide-react";
import { HealthcarePageShell } from "@/components/healthcare/healthcare-page-shell";

export default function PatientFlowPage() {
  return (
    <HealthcarePageShell
      icon={Users}
      title="Patient Flow"
      description="Census, ED throughput, and bed capacity — clinical data appears when facility feeds are connected."
      sections={[
        {
          title: "Ward census",
          rows: ["ICU capacity", "Med-Surg occupancy", "ED boarding"],
        },
        {
          title: "Throughput",
          rows: ["Admissions today", "Discharges today", "Average ED wait"],
        },
      ]}
    />
  );
}
