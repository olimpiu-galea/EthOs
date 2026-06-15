import type { IndustryDomain } from "./types";
import type { LucideIcon } from "lucide-react";
import { ClipboardCheck, Layers, ShieldCheck, Stethoscope, Users } from "lucide-react";

export type SuiteNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  ready: boolean;
};

export function operationsSuiteForDomain(
  domain: IndustryDomain,
): SuiteNavItem[] {
  switch (domain) {
    case "healthcare":
      return [
        {
          href: "/healthcare/patient-flow",
          label: "Patient Flow",
          icon: Users,
          ready: true,
        },
        {
          href: "/healthcare/equipment",
          label: "Equipment",
          icon: Stethoscope,
          ready: true,
        },
        {
          href: "/healthcare/compliance",
          label: "Compliance",
          icon: ClipboardCheck,
          ready: true,
        },
      ];
    case "ethanol":
    default:
      return [
        { href: "/operational", label: "Operational", icon: Layers, ready: true },
        {
          href: "/compliance",
          label: "Compliance",
          icon: ShieldCheck,
          ready: true,
        },
      ];
  }
}

export function domainAccentLabel(domain: IndustryDomain): string {
  const map: Record<IndustryDomain, string> = {
    ethanol: "Ethanol Operations",
    healthcare: "Healthcare Operations",
    steel: "Steel Mill",
    food_beverage: "Food & Beverage",
    water: "Water Treatment",
    pharma: "Pharma Manufacturing",
  };
  return map[domain];
}

export const HEALTHCARE_KPI_FIXTURE = {
  patientFlow: {
    edWaitMin: 28,
    occupiedBeds: 142,
    totalBeds: 180,
    dischargesToday: 34,
    admissionsToday: 41,
    criticalAlerts: 2,
  },
  equipment: {
    mriUptime: 98.2,
    ventilatorsActive: 18,
    ventilatorsTotal: 24,
    infusionPumpAlerts: 3,
    sterilizerCycles: 6,
  },
  compliance: {
    openIncidents: 4,
    auditsDue: 2,
    trainingCompliance: 94,
    hipaaFlags: 0,
    medicationVariance: 1,
  },
};
