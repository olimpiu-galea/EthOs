import type { IndustryDomain, UserRole } from "@/lib/types";
import type { CompanyFeedConfig } from "@/lib/company-features";
import { isCompanyFeedAvailable } from "@/lib/company-feed-visibility";
import {
  operationsSuiteForDomain,
  type SuiteNavItem,
} from "@/lib/domain-config";
import { Package, Wallet } from "lucide-react";

export function canSeeIntegrations(role: UserRole): boolean {
  return role === "company_admin" || role === "platform_admin";
}

export function canSeeMarginDesk(role: UserRole): boolean {
  return (
    role === "financial" ||
    role === "procurement" ||
    role === "supervisor" ||
    role === "company_admin" ||
    role === "platform_admin"
  );
}

export function canSeeInventory(role: UserRole): boolean {
  return role !== "financial" && role !== "qa_lab";
}

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
    canSeeMarginDesk(role) &&
    isCompanyFeedAvailable("commodity", feedOpts)
  ) {
    extras.push({
      href: "/margin",
      label: "Margin Desk",
      icon: Wallet,
      ready: true,
    });
  }
  if (
    canSeeInventory(role) &&
    isCompanyFeedAvailable("inventory", feedOpts)
  ) {
    extras.push({
      href: "/inventory",
      label: "Inventory",
      icon: Package,
      ready: true,
    });
  }

  if (extras.length === 0) return base;

  const batchesIdx = base.findIndex((i) => i.href === "/batches");
  if (batchesIdx < 0) return [...base, ...extras];

  return [
    ...base.slice(0, batchesIdx + 1),
    ...extras,
    ...base.slice(batchesIdx + 1),
  ];
}

export function extrasNavLabel(_role?: UserRole): string {
  return "Extras";
}

/** Default app entry after login / Open workspace */
export function workspaceHomePath(_role: UserRole): string {
  return "/";
}
