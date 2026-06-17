"use client";

import type { Playbook } from "./types";
import { criticalPlaybookAlert } from "./types";
import {
  buildAceticConditionGroups,
  ACETIC_BUILTIN_ID,
  ACETIC_PLAYBOOK_NAME,
} from "./acetic-rules";
import {
  buildPotentialVsTempConditionGroups,
  POTENTIAL_VS_TEMP_BUILTIN_ID,
  POTENTIAL_VS_TEMP_PLAYBOOK_NAME,
} from "./potential-vs-temp-rules";
import {
  ACETIC_ACTION_ITEMS,
  ACETIC_GUIDANCE,
} from "./default-playbook-response-acetic";
import {
  POTENTIAL_VS_TEMP_ACTION_ITEMS,
  POTENTIAL_VS_TEMP_GUIDANCE,
} from "./default-playbook-response-potential-temp";
import {
  LAKEVIEW_TEAM_OPERATIONAL,
  LAKEVIEW_WORKSPACE_DEMOS,
  createWorkspaceDailyPlaybook,
  ensureLakeviewDemoSeed,
} from "./lakeview-demo-seed";
import { routedRolesForTeam } from "./teams";

export function createPotentialVsTempPlaybook(): Omit<Playbook, "id"> {
  return {
    name: POTENTIAL_VS_TEMP_PLAYBOOK_NAME,
    description:
      "Fermentation checkpoint playbook — potential bands set temperature caps at 6h through 50h. Uses Ferm Data field signals; agenda alerts are pre-computed from batch history.",
    status: "active",
    builtinId: POTENTIAL_VS_TEMP_BUILTIN_ID,
    conditions: [],
    matchMode: "any",
    conditionGroups: buildPotentialVsTempConditionGroups(),
    groupMatchMode: "any",
    actionItems: POTENTIAL_VS_TEMP_ACTION_ITEMS.map((a) => ({ ...a })),
    guidance: POTENTIAL_VS_TEMP_GUIDANCE.map((g) => ({ ...g })),
    alert: criticalPlaybookAlert(
      "Measured temperature exceeded the control limit for this checkpoint",
    ),
  };
}

export function createAceticPlaybook(): Omit<Playbook, "id"> {
  return {
    name: ACETIC_PLAYBOOK_NAME,
    description:
      "Descriptive bad-batch cluster playbook — acetic acid vs cell count (YP–6h) and potential (12h–50h). Pre-computed alerts from batch history; informative only, not a live action-cap playbook.",
    status: "active",
    builtinId: ACETIC_BUILTIN_ID,
    conditions: [],
    matchMode: "any",
    conditionGroups: buildAceticConditionGroups(),
    groupMatchMode: "any",
    actionItems: ACETIC_ACTION_ITEMS.map((a) => ({ ...a })),
    guidance: ACETIC_GUIDANCE.map((g) => ({ ...g })),
    alert: criticalPlaybookAlert(
      "Acetic acid and secondary indicator match a bad-batch cluster at this checkpoint",
    ),
  };
}

function ensureBuiltinPlaybook(
  template: Omit<Playbook, "id">,
  existing: Playbook | undefined,
  upsert: (id: string, patch: Partial<Playbook>) => void,
  add: (playbook: Omit<Playbook, "id">) => void,
): void {
  if (!existing) {
    add(template);
    return;
  }

  if (!(existing.conditionGroups?.length ?? 0)) {
    upsert(existing.id, {
      name: template.name,
      description: template.description,
      conditions: template.conditions,
      matchMode: template.matchMode,
      conditionGroups: template.conditionGroups,
      groupMatchMode: template.groupMatchMode,
      actionItems: template.actionItems,
      guidance: template.guidance,
      alert: template.alert,
      status: "active",
      teamId: template.teamId ?? existing.teamId,
      teamIds: template.teamIds ?? existing.teamIds,
      routedRoles: template.routedRoles ?? existing.routedRoles,
    });
    return;
  }

  upsert(existing.id, {
    name: template.name,
    description: template.description,
    matchMode: template.matchMode,
    groupMatchMode: template.groupMatchMode,
    actionItems: template.actionItems,
    guidance: template.guidance,
    alert: template.alert,
    status: "active",
    ...(template.teamIds?.length
      ? {
          teamId: template.teamId,
          teamIds: template.teamIds,
          routedRoles: template.routedRoles,
        }
      : template.teamId && !existing.teamId
        ? { teamId: template.teamId, routedRoles: template.routedRoles }
        : {}),
  });
}

/** Ensure built-in playbooks exist for every workspace */
export async function ensureDefaultPlaybooks(): Promise<void> {
  await ensureLakeviewDemoSeed();

  const { usePlaybookStore } = await import("@/stores/playbook-store");
  const { useSettingsStore } = await import("@/stores/settings-store");
  const { listUsersForCompany } = await import("@/lib/company-registry");
  const { useAuthStore } = await import("@/stores/auth-store");
  const store = usePlaybookStore.getState();
  const settings = useSettingsStore.getState();
  const teams = settings.teams;
  const users = listUsersForCompany(
    settings.companyId,
    useAuthStore.getState().users,
  );

  const operationalTeam = teams.find((t) => t.id === LAKEVIEW_TEAM_OPERATIONAL);
  const opMeta = operationalTeam
    ? {
        teamId: operationalTeam.id,
        teamIds: [operationalTeam.id],
        routedRoles: routedRolesForTeam(operationalTeam.id, teams, users),
      }
    : {};

  const workspaceTemplates = LAKEVIEW_WORKSPACE_DEMOS.map((demo) =>
    createWorkspaceDailyPlaybook(demo, users, teams),
  );

  const builtins = [
    ...workspaceTemplates,
    { ...createPotentialVsTempPlaybook(), ...opMeta },
    { ...createAceticPlaybook(), ...opMeta },
  ];

  for (const template of builtins) {
    const existing = store.playbooks.find(
      (p) => p.builtinId === template.builtinId,
    );
    ensureBuiltinPlaybook(
      template,
      existing,
      store.updatePlaybook.bind(store),
      store.addPlaybook.bind(store),
    );
  }

  const { applyLabGatedMockPlaybooksGate } = await import(
    "@/lib/lab-gated-mock-playbooks-gate"
  );
  await applyLabGatedMockPlaybooksGate();

  const { ensureWorkspaceWatchPlaybooks } = await import(
    "@/lib/workspace-watch-playbook-seed"
  );
  await ensureWorkspaceWatchPlaybooks(teams, users);

  const { ensureLakeviewDemoReports } = await import(
    "@/lib/lakeview-demo-reports-seed"
  );
  await ensureLakeviewDemoReports();
}
