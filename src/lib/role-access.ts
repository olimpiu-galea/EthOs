import type { IndustryDomain, UserRole } from "@/lib/types";
import type { CompanyFeedConfig } from "@/lib/company-features";
import { isCompanyFeedAvailable } from "@/lib/company-feed-visibility";
import {
  operationsSuiteForDomain,
  type SuiteNavItem,
} from "@/lib/domain-config";
import { Package, Wallet, Wrench } from "lucide-react";

export function canSeeIntegrations(role: UserRole): boolean {
  return role === "company_admin" || role === "platform_admin";
}

export function canSeeFinancial(role: UserRole): boolean {
  return (
    role === "financial" ||
    role === "procurement" ||
    role === "supervisor" ||
    role === "company_admin" ||
    role === "platform_admin"
  );
}

/** @deprecated use canSeeFinancial */
export const canSeeMarginDesk = canSeeFinancial;

export function canSeeProcurement(role: UserRole): boolean {
  return role !== "financial" && role !== "qa_lab";
}

export function canSeeMaintenance(role: UserRole): boolean {
  return (
    role === "maintenance" ||
    role === "supervisor" ||
    role === "operational" ||
    role === "company_admin" ||
    role === "platform_admin"
  );
}

/** @deprecated use canSeeProcurement */
export const canSeeInventory = canSeeProcurement;

export type SignalFeed = "dcs" | "lab" | "commodity" | "inventory";

/** Signal feeds each role needs for agenda playbooks — connected on login without Integrations UI */
export function signalFeedsForRole(role: UserRole): SignalFeed[] {
  switch (role) {
    case "financial":
    case "operational":
      return ["dcs", "lab", "commodity", "inventory"];
    case "procurement":
      return ["commodity", "inventory"];
    case "qa_lab":
      return ["lab", "dcs"];
    case "maintenance":
      return ["dcs"];
    case "company_admin":
    case "supervisor":
    case "platform_admin":
      return ["dcs", "lab"];
    default:
      return [];
  }
}

export function shouldAutoConnectIntegrations(role: UserRole): boolean {
  return signalFeedsForRole(role).length > 0;
}

export function buildSuiteNav(
  domain: IndustryDomain,
  role: UserRole,
  opts: {
    operationsSuiteEnabled: boolean;
    companyFeeds: CompanyFeedConfig;
  },
): SuiteNavItem[] {
  const base = operationsSuiteForDomain(domain);

  if (!opts.operationsSuiteEnabled) {
    return [];
  }

  if (domain !== "ethanol") return base;

  const feedOpts = {
    companyFeeds: opts.companyFeeds,
    phrase2Enabled: opts.operationsSuiteEnabled,
  };

  const extras: SuiteNavItem[] = [];
  if (
    canSeeProcurement(role) &&
    isCompanyFeedAvailable("inventory", feedOpts)
  ) {
    extras.push({
      href: "/procurement",
      label: "Procurement",
      icon: Package,
      ready: true,
    });
  }
  if (canSeeMaintenance(role)) {
    extras.push({
      href: "/maintenance",
      label: "Maintenance",
      icon: Wrench,
      ready: true,
    });
  }
  if (
    canSeeFinancial(role) &&
    isCompanyFeedAvailable("commodity", feedOpts)
  ) {
    extras.push({
      href: "/financial",
      label: "Financial",
      icon: Wallet,
      ready: true,
    });
  }

  if (extras.length === 0) return base;

  const operationalIdx = base.findIndex((i) => i.href === "/operational");
  if (operationalIdx < 0) return [...base, ...extras];

  return [
    ...base.slice(0, operationalIdx + 1),
    ...extras,
    ...base.slice(operationalIdx + 1),
  ];
}

/** Default app entry after login / Open workspace */
export function workspaceHomePath(_role: UserRole): string {
  return "/";
}
