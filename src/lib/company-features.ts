import { DEFAULT_COMPANY } from "./auth-constants";
import type { SignalSource } from "@/lib/types";

export type CompanyFeedConfig = Record<SignalSource, boolean>;

export const EMPTY_COMPANY_FEEDS: CompanyFeedConfig = {
  dcs: true,
  lab: true,
  commodity: true,
  inventory: true,
};

/** Lakeview demo defaults */
export const DEFAULT_COMPANY_FEEDS: CompanyFeedConfig = {
  dcs: true,
  lab: true,
  commodity: true,
  inventory: true,
};

export function defaultFeedsForCompany(companyId: string): CompanyFeedConfig {
  return companyId === DEFAULT_COMPANY.id
    ? { ...DEFAULT_COMPANY_FEEDS }
    : { ...EMPTY_COMPANY_FEEDS };
}



export const FEED_LABELS: Record<SignalSource, { label: string; description: string }> = {

  dcs: {

    label: "DCS · process signals",

    description: "Fermentation, distillation, and utility tags for operational playbooks.",

  },

  lab: {

    label: "Lab Sheet · XLSX",

    description: "Lab notebook fields — map columns once, upload updates on a schedule.",

  },

  commodity: {

    label: "Commodity margin feed",

    description: "Surplus gallons, margin per gal, and sell/hold signals (Phrase 2).",

  },

  inventory: {

    label: "Procurement",

    description: "Materials on hand and reorder thresholds (Phrase 2).",

  },

};


