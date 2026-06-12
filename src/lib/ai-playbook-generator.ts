import type { AlertSeverity, Playbook, PlaybookAlert, PlaybookCondition } from "./types";
import { inferRoutedRoles } from "./playbook-routing";
import { listUsersForCompany } from "@/lib/company-registry";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { inferTeamIdFromPlaybook, routedRolesForTeam } from "./teams";
import { canonicalSignalLabel } from "./ferm-signals";
import { createEmptyCondition } from "./playbook-utils";
import {
  DEFAULT_ACTION_ITEMS,
  DEFAULT_GUIDANCE,
  FINANCIAL_ACTION_ITEMS,
  FINANCIAL_GUIDANCE,
} from "./default-playbook-response";

type Generated = Omit<Playbook, "id">;

function alertWith(
  severity: AlertSeverity,
  title: string,
  message: string,
): PlaybookAlert {
  const predefinedId =
    severity === "critical"
      ? "critical"
      : severity === "info"
        ? "info"
        : "warning";
  return { type: "predefined", predefinedId, title, message, severity };
}

const KEYWORD_RULES: {
  pattern: RegExp;
  apply: (g: Generated) => Generated;
}[] = [
  {
    pattern: /ferm|fermentation|temp/i,
    apply: (g) => {
      const c = createEmptyCondition();
      c.rule = {
        signalId: "TE-3301/_.PV#Value",
        displayLabel: "Reactor Temp PV",
        operator: ">",
        threshold: 92,
        duration: { value: 30, unit: "min" },
        aggregation: "avg",
      };
      return {
        ...g,
        name: "Fermentation temperature deviation",
        conditions: [c],
        alert: alertWith(
          "warning",
          "Fermentation temp high",
          "Fermenter temperature exceeded 92°F for 30 minutes — verify cooling and yeast health.",
        ),
      };
    },
  },
  {
    pattern: /ph|acid/i,
    apply: (g) => {
      const c = createEmptyCondition();
      c.rule = {
        signalId: "LAB-F1-PH/_.Value",
        displayLabel: "F1 pH",
        operator: "<",
        threshold: 4.0,
        aggregation: "instant",
      };
      return {
        ...g,
        name: "Low fermentation pH",
        conditions: [c],
        alert: alertWith(
          "warning",
          "pH drop alert",
          "Lab pH below 4.0 — risk of bacterial stress. Sample and adjust.",
        ),
      };
    },
  },
  {
    pattern: /margin|surplus|sell|commodity|financial|contract/i,
    apply: (g) => ({
      ...g,
      name: "Surplus sell opportunity",
      conditions: [
        (() => {
          const c = createEmptyCondition();
          c.rule = {
            signalId: "MKT-MARGIN/_.PerGal",
            displayLabel: "Margin Per Gallon",
            operator: ">",
            threshold: 0.15,
            aggregation: "instant",
          };
          return c;
        })(),
        (() => {
          const c = createEmptyCondition();
          c.rule = {
            signalId: "MKT-MARKET/_.Signal",
            displayLabel: "Market Sell Signal",
            operator: "==",
            threshold: 1,
            aggregation: "instant",
          };
          return c;
        })(),
      ],
      matchMode: "all",
      actionItems: FINANCIAL_ACTION_ITEMS,
      guidance: FINANCIAL_GUIDANCE,
      alert: alertWith(
        "info",
        "Sell surplus on spot?",
        "Margin and market signal favor selling unsold surplus after contract fulfillment.",
      ),
    }),
  },
  {
    pattern: /contam|infection/i,
    apply: (g) => {
      const c = createEmptyCondition();
      c.rule = {
        signalId: "LAB-F4-CONTAM/_.Value",
        displayLabel: "F4 Contamination",
        operator: "==",
        threshold: 1,
        aggregation: "instant",
      };
      return {
        ...g,
        name: "Contamination detected",
        conditions: [c],
        alert: alertWith(
          "critical",
          "Critical — contamination",
          "Lab flagged contamination on F4. Isolate batch and notify QA.",
        ),
      };
    },
  },
  {
    pattern: /pressure|header/i,
    apply: (g) => {
      const c = createEmptyCondition();
      c.rule = {
        signalId: "PT-1102/_.PV#Value",
        displayLabel: "Header Pressure",
        operator: ">",
        threshold: 2.8,
        aggregation: "instant",
      };
      return {
        ...g,
        name: "Header pressure high",
        conditions: [c],
        alert: alertWith(
          "warning",
          "Pressure warning",
          "Header pressure above 2.8 bar — check relief and downstream valves.",
        ),
      };
    },
  },
];

export function generatePlaybookFromDescription(
  description: string,
): Generated {
  let result: Generated = {
    name: "AI generated playbook",
    description: description.trim(),
    status: "disabled",
    conditions: [createEmptyCondition()],
    matchMode: "all",
    actionItems: DEFAULT_ACTION_ITEMS,
    guidance: DEFAULT_GUIDANCE,
    alert: alertWith(
      "warning",
      "Operator alert",
      "Condition matched — follow action items and guidance.",
    ),
  };

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(description)) {
      result = rule.apply(result);
      break;
    }
  }

  if (result.name === "AI generated playbook") {
    result.name = `Monitor: ${description.slice(0, 48)}${description.length > 48 ? "…" : ""}`;
  }

  const teams = useSettingsStore.getState().teams;
  const companyId = useSettingsStore.getState().companyId;
  const users = listUsersForCompany(companyId, useAuthStore.getState().users);
  const teamId = inferTeamIdFromPlaybook(result, teams);
  const routedRoles =
    routedRolesForTeam(teamId, teams, users) ?? inferRoutedRoles(result);
  return {
    ...result,
    teamId,
    routedRoles,
  };
}

export function previewPlaybookConditions(
  conditions: PlaybookCondition[],
): string {
  return conditions
    .map((c) => {
      const r = c.rule;
      const dur = r.duration
        ? ` for ${r.duration.value}${r.duration.unit}`
        : "";
      return `${canonicalSignalLabel(r)} ${r.operator} ${r.threshold}${dur}`;
    })
    .join(" AND ");
}
