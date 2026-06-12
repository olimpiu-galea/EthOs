import {
  listTeamAssignableUsers,
  listUsersForCompany,
} from "@/lib/company-registry";
import type { AuthUser, UserRole } from "./types";

export type OpsTeam = {
  id: string;
  name: string;
  description?: string;
  /** When false, team is hidden from lens, playbook assign, and alert routing */
  enabled: boolean;
  /** Company users who receive this team's alerts */
  memberUserIds: string[];
};

type LegacyOpsTeam = {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  memberUserIds?: string[];
  memberRoles?: UserRole[];
};

/** All companies start with no teams — users create their own in Settings */
export function defaultTeamsForCompany(_companyId: string): OpsTeam[] {
  return [];
}

export function enabledTeams(teams: OpsTeam[]): OpsTeam[] {
  return teams.filter((t) => t.enabled);
}

export function migrateOpsTeam(
  team: LegacyOpsTeam,
  companyId: string,
  registeredUsers: AuthUser[] = [],
): OpsTeam {
  if (team.memberUserIds?.length) {
    const assignable = new Set(
      listTeamAssignableUsers(companyId, registeredUsers).map((u) => u.id),
    );
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      enabled: team.enabled ?? true,
      memberUserIds: team.memberUserIds.filter((id) => assignable.has(id)),
    };
  }

  const memberRoles = team.memberRoles ?? [];
  const users = listTeamAssignableUsers(companyId, registeredUsers);
  let memberUserIds = users
    .filter((u) => memberRoles.includes(u.role))
    .map((u) => u.id);

  if (!memberUserIds.length && memberRoles.length) {
    memberUserIds = users
      .filter((u) => u.role === memberRoles[0])
      .map((u) => u.id);
  }

  return {
    id: team.id,
    name: team.name,
    description: team.description,
    enabled: team.enabled ?? true,
    memberUserIds,
  };
}

export function migrateTeamsForCompany(
  teams: LegacyOpsTeam[],
  companyId: string,
  registeredUsers: AuthUser[] = [],
): OpsTeam[] {
  return teams.map((t) => migrateOpsTeam(t, companyId, registeredUsers));
}

export function agendaLensesForTeams(teams: OpsTeam[]) {
  const active = enabledTeams(teams);
  return [
    { id: "all" as const, label: "All teams" },
    ...active.map((t) => ({ id: t.id, label: t.name })),
  ];
}

export type AgendaLensId = "all" | string;

export function teamForId(
  teamId: string | undefined,
  teams: OpsTeam[],
): OpsTeam | undefined {
  if (!teamId) return undefined;
  return teams.find((t) => t.id === teamId);
}

export function teamNameForId(
  teamId: string | undefined,
  teams: OpsTeam[],
): string {
  return teamForId(teamId, teams)?.name ?? "Unassigned";
}

export function routedRolesForTeam(
  teamId: string | undefined,
  teams: OpsTeam[],
  users: AuthUser[] = [],
): UserRole[] | undefined {
  if (!teamId) return undefined;
  const team = teams.find((t) => t.id === teamId);
  if (!team) return undefined;

  const roles = new Set<UserRole>();
  for (const userId of team.memberUserIds) {
    const user = users.find((u) => u.id === userId);
    if (user) roles.add(user.role);
  }
  return roles.size ? [...roles] : undefined;
}

export function isOperationsLikeTeam(team: OpsTeam | undefined): boolean {
  if (!team) return false;
  return /operat|ferment|distill|shift|maintenance|utilities|lab|qa/i.test(
    team.name,
  );
}

export function isFinanceLikeTeam(team: OpsTeam | undefined): boolean {
  if (!team) return false;
  return /finance|margin|procurement|commodity/i.test(team.name);
}

export function inferTeamIdFromPlaybook(
  playbook: Pick<
    import("./types").Playbook,
    "teamId" | "routedRoles" | "name" | "conditions"
  >,
  teams: OpsTeam[] = [],
): string | undefined {
  const active = enabledTeams(teams);
  if (playbook.teamId && active.some((t) => t.id === playbook.teamId)) {
    return playbook.teamId;
  }

  const text = playbook.name ?? "";
  if (/margin|commodity|corn|inventory|procurement|financial/i.test(text)) {
    return (
      active.find((t) => /finance|margin|procurement/i.test(t.name))?.id ??
      active[0]?.id
    );
  }
  if (/lab|quality|brix|ph|contam/i.test(text)) {
    return (
      active.find((t) => /lab|qa|quality/i.test(t.name))?.id ?? active[0]?.id
    );
  }
  if (/maintenance|pressure|valve|steam/i.test(text)) {
    return (
      active.find((t) => /maintenance|utilities/i.test(t.name))?.id ??
      active[0]?.id
    );
  }

  return (
    active.find((t) => /operat|ferment|distill|shift/i.test(t.name))?.id ??
    active[0]?.id
  );
}

export function financeTeamId(teams: OpsTeam[]): string | undefined {
  const active = enabledTeams(teams);
  return active.find((t) => isFinanceLikeTeam(t))?.id ?? active[0]?.id;
}

export function operationsTeamId(teams: OpsTeam[]): string | undefined {
  const active = enabledTeams(teams);
  return (
    active.find((t) => isOperationsLikeTeam(t) && !isFinanceLikeTeam(t))?.id ??
    active[0]?.id
  );
}

export function defaultTeamIdForNewPlaybook(teams: OpsTeam[]): string | undefined {
  const active = enabledTeams(teams);
  return (
    active.find((t) => /operat|shift|ferment/i.test(t.name))?.id ??
    active[0]?.id
  );
}

export function userSeesTeamAlert(
  viewer: Pick<AuthUser, "id" | "role">,
  teamId: string | undefined,
  teams: OpsTeam[],
): boolean {
  if (
    viewer.role === "platform_admin" ||
    viewer.role === "company_admin" ||
    viewer.role === "supervisor"
  ) {
    return true;
  }
  if (!teamId) return true;

  const team = teams.find((t) => t.id === teamId);
  if (!team || !team.enabled) return false;
  return team.memberUserIds.includes(viewer.id);
}

export function memberNamesForTeam(
  team: OpsTeam,
  users: AuthUser[],
): string[] {
  return team.memberUserIds
    .map((id) => users.find((u) => u.id === id)?.name)
    .filter((name): name is string => Boolean(name));
}
