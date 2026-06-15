import { batchContextForOperationalAlert } from "@/lib/batch-context";

import { inferRoutedRoles } from "@/lib/playbook-routing";

import { listUsersForCompany } from "@/lib/company-registry";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";

import {

  inferTeamIdFromPlaybook,

  isOperationsLikeTeam,

  resolveAlertTeamIds,
  resolvePlaybookTeamIds,

  routedRolesForTeam,
  routedRolesForTeams,

  teamForId,

} from "@/lib/teams";

import {
  DEFAULT_ACTION_ITEMS,
  DEFAULT_GUIDANCE,
} from "@/lib/default-playbook-response";
import type {
  AlertAgendaItem,
  Playbook,
  PlaybookActionItem,
  PlaybookGuidanceStep,
} from "@/lib/types";
import { alertTypeLabel } from "@/lib/types";



function teamsFromStore() {
  return useSettingsStore.getState().teams;
}

function companyUsersFromStore() {
  const { companyId } = useSettingsStore.getState();
  return listUsersForCompany(companyId, useAuthStore.getState().users);
}



export function playbookActionItemsForAlert(
  playbook: Playbook,
  fallback: PlaybookActionItem[] = DEFAULT_ACTION_ITEMS,
): PlaybookActionItem[] {
  return playbook.actionItems?.length ? playbook.actionItems : fallback;
}

export function playbookGuidanceForAlert(
  playbook: Playbook,
  fallback: PlaybookGuidanceStep[] = DEFAULT_GUIDANCE,
): PlaybookGuidanceStep[] {
  return playbook.guidance?.length ? playbook.guidance : fallback;
}

/** Keep alert rows aligned with the current playbook definition */
export function applyPlaybookContentToAlert(
  item: AlertAgendaItem,
  playbook: Playbook,
  options?: {
    actionItemsFallback?: PlaybookActionItem[];
    guidanceFallback?: PlaybookGuidanceStep[];
    preserveAlertMessage?: boolean;
  },
): AlertAgendaItem {
  const actionItems = playbookActionItemsForAlert(
    playbook,
    options?.actionItemsFallback,
  );
  const guidance = playbookGuidanceForAlert(
    playbook,
    options?.guidanceFallback,
  );
  const validIds = new Set(actionItems.map((a) => a.id));

  return {
    ...item,
    playbookName: playbook.name,
    alertTitle: alertTypeLabel(playbook.alert),
    alertMessage: options?.preserveAlertMessage
      ? item.alertMessage
      : playbook.alert.message,
    severity: playbook.alert.severity,
    actionItems,
    guidance,
    completedActionIds: (item.completedActionIds ?? []).filter((id) =>
      validIds.has(id),
    ),
  };
}

export function enrichAlertFromPlaybook(

  base: Omit<AlertAgendaItem, "id" | "status"> &

    Partial<Pick<AlertAgendaItem, "status">>,

  playbook: Playbook,

): Omit<AlertAgendaItem, "id"> {

  const teams = teamsFromStore();
  const users = companyUsersFromStore();

  const teamIds = resolvePlaybookTeamIds(playbook, teams);

  const teamId = teamIds[0] ?? inferTeamIdFromPlaybook(playbook, teams);

  const routedRoles =

    routedRolesForTeams(teamIds, teams, users) ??

    routedRolesForTeam(teamId, teams, users) ??

    playbook.routedRoles ??

    inferRoutedRoles(playbook);

  const batchContext = teamIds.some((id) =>
    isOperationsLikeTeam(teamForId(id, teams)),
  )
      ? batchContextForOperationalAlert()

      : undefined;



  return {

    ...base,

    severity: playbook.alert.severity,

    status: base.status ?? "active",

    lifecycle: base.lifecycle ?? "new",

    escalationLevel: base.escalationLevel ?? 0,

    teamIds: teamIds.length ? teamIds : teamId ? [teamId] : undefined,

    teamId,

    routedRoles,

    batchContext: base.batchContext ?? batchContext,

  };

}



export function migrateAlertItem(item: AlertAgendaItem): AlertAgendaItem {

  const teams = teamsFromStore();
  const users = companyUsersFromStore();

  const lifecycle =

    item.lifecycle ??

    (item.status === "completed" || item.manuallyCompleted

      ? "resolved"

      : "new");



  const legacy = item as AlertAgendaItem & {

    category?: string;

    alertCategory?: string;

  };



  const teamIds = resolveAlertTeamIds(item, teams);

  const teamId =

    teamIds[0] ??

    item.teamId ??

    inferTeamIdFromPlaybook(

      {

        name: item.playbookName,

        teamId: item.teamId,

        teamIds: item.teamIds,

        routedRoles: item.routedRoles,

        conditions: [],

      },

      teams,

    );



  const routedRoles =

    routedRolesForTeams(teamIds, teams, users) ??

    routedRolesForTeam(teamId, teams, users) ??

    item.routedRoles ??

    inferRoutedRoles({

      name: item.playbookName,

      description: item.alertMessage ?? "",

      conditions: [],

    });



  const { category: _c, alertCategory: _a, ...rest } = legacy;



  return {

    ...rest,

    lifecycle,

    escalationLevel: item.escalationLevel ?? 0,

    teamIds: teamIds.length ? teamIds : teamId ? [teamId] : undefined,

    teamId,

    routedRoles,

    comments: item.comments ?? [],

  };

}


