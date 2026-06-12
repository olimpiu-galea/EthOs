import type { AlertAgendaItem, AuthUser, UserRole } from "./types";
import { canSeeAllAgendaTeams } from "./auth-constants";
import type { AgendaLensId, OpsTeam } from "./teams";
import { enabledTeams, userSeesTeamAlert } from "./teams";

export type { AgendaLensId } from "./teams";

/** @deprecated use agendaLensesForTeams */
export const ADMIN_AGENDA_LENSES: { id: AgendaLensId; label: string }[] = [
  { id: "all", label: "All teams" },
];

function filterByTeamLens(
  items: AlertAgendaItem[],
  lens: AgendaLensId,
): AlertAgendaItem[] {
  if (lens === "all") return items;
  return items.filter((i) => i.teamId === lens);
}

/** Filter agenda for a viewer based on team membership */
export function filterAgendaAsUser(
  items: AlertAgendaItem[],
  viewer: Pick<AuthUser, "id" | "role">,
  teams: OpsTeam[],
): AlertAgendaItem[] {
  return items.filter((i) => userSeesTeamAlert(viewer, i.teamId, teams));
}

/** @deprecated use filterAgendaAsUser */
export function filterAgendaAsRole(
  items: AlertAgendaItem[],
  asRole: UserRole,
  teams: OpsTeam[],
  viewerId = "",
): AlertAgendaItem[] {
  return filterAgendaAsUser(items, { id: viewerId, role: asRole }, teams);
}

export function filterAgendaForViewer(
  items: AlertAgendaItem[],
  viewer: Pick<AuthUser, "id" | "role">,
  lens: AgendaLensId = "all",
  teams: OpsTeam[] = [],
): AlertAgendaItem[] {
  const activeTeams = enabledTeams(teams);

  if (!canSeeAllAgendaTeams(viewer.role)) {
    return filterAgendaAsUser(items, viewer, activeTeams);
  }

  return filterByTeamLens(items, lens);
}

/** @deprecated use filterAgendaForViewer */
export function filterAgendaForRole(
  items: AlertAgendaItem[],
  role: UserRole,
): AlertAgendaItem[] {
  return filterAgendaForViewer(items, { id: "", role });
}

export function nextTriggerEstimate(
  lastTriggeredAt: number | undefined,
  cooldownMs: number,
): Date | null {
  if (!lastTriggeredAt) return null;
  return new Date(lastTriggeredAt + cooldownMs);
}
