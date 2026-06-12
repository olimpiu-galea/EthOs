import type { Playbook } from "./types";
import { createEmptyCondition } from "./playbook-utils";
import {
  DEFAULT_ACTION_ITEMS,
  DEFAULT_GUIDANCE,
  FINANCIAL_ACTION_ITEMS,
  FINANCIAL_GUIDANCE,
} from "./default-playbook-response";

export type PremiumCatalogItem = {
  catalogId: string;
  price: number;
  playbook: Omit<Playbook, "id">;
  highlight: string;
};

export const PREMIUM_CATALOG: PremiumCatalogItem[] = [
  {
    catalogId: "premium-ferm-optimizer",
    price: 49,
    highlight: "AI-tuned for Lakeview fermentation trains",
    playbook: {
      name: "Fermentation yield optimizer",
      description:
        "Multi-signal playbook combining DCS temp and lab Brix to catch yield loss early.",
      status: "disabled",
      matchMode: "all",
      actionItems: DEFAULT_ACTION_ITEMS,
      guidance: DEFAULT_GUIDANCE,
      isPremium: true,
      premiumPrice: 49,
      conditions: [
        (() => {
          const c = createEmptyCondition();
          c.rule = {
            signalId: "TE-3301/_.PV#Value",
            displayLabel: "Reactor Temp PV",
            operator: ">",
            threshold: 91,
            duration: { value: 20, unit: "min" },
            aggregation: "avg",
          };
          return c;
        })(),
        (() => {
          const c = createEmptyCondition();
          c.rule = {
            signalId: "LAB-F2-BRIX/_.Value",
            displayLabel: "F2 Brix",
            operator: "<",
            threshold: 8.0,
            aggregation: "instant",
          };
          return c;
        })(),
      ],
      alert: {
        type: "predefined",
        predefinedId: "warning",
        title: "Yield risk — temp + Brix",
        message:
          "Temperature elevated while Brix stalling — classic yield loss pattern.",
        severity: "warning",
      },
    },
  },
  {
    catalogId: "premium-margin-desk",
    price: 79,
    highlight: "Commodity desk playbook — sell vs hold surplus",
    playbook: {
      name: "Surplus margin desk",
      description:
        "Financial alert when margin, market signal, and inventory days align for a spot sale.",
      status: "disabled",
      matchMode: "all",
      actionItems: FINANCIAL_ACTION_ITEMS,
      guidance: FINANCIAL_GUIDANCE,
      isPremium: true,
      premiumPrice: 79,
      conditions: [
        (() => {
          const c = createEmptyCondition();
          c.rule = {
            signalId: "MKT-MARGIN/_.PerGal",
            displayLabel: "Margin Per Gallon",
            operator: ">",
            threshold: 0.14,
            aggregation: "instant",
          };
          return c;
        })(),
        (() => {
          const c = createEmptyCondition();
          c.rule = {
            signalId: "MKT-INVENTORY/_.Days",
            displayLabel: "Inventory Days Supply",
            operator: ">",
            threshold: 10,
            aggregation: "instant",
          };
          return c;
        })(),
      ],
      alert: {
        type: "predefined",
        predefinedId: "info",
        title: "Margin desk — evaluate spot sale",
        message:
          "Strong margin with elevated inventory days. Review contract coverage before selling surplus.",
        severity: "info",
      },
    },
  },
  {
    catalogId: "premium-energy-spike",
    price: 39,
    highlight: "Energy cost spike detection per gallon",
    playbook: {
      name: "Energy cost spike guard",
      description:
        "Flags when energy cost per gallon exceeds threshold — impacts margin before market moves.",
      status: "disabled",
      matchMode: "all",
      actionItems: FINANCIAL_ACTION_ITEMS.slice(0, 3),
      guidance: FINANCIAL_GUIDANCE.slice(0, 2),
      isPremium: true,
      premiumPrice: 39,
      conditions: [
        (() => {
          const c = createEmptyCondition();
          c.rule = {
            signalId: "MKT-ENERGY/_.Cost",
            displayLabel: "Energy Cost Per Gal",
            operator: ">",
            threshold: 0.45,
            aggregation: "instant",
          };
          return c;
        })(),
      ],
      alert: {
        type: "predefined",
        predefinedId: "warning",
        title: "Energy cost elevated",
        message: "Energy per gallon above $0.45 — review steam and NG consumption.",
        severity: "warning",
      },
    },
  },
];
