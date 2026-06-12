import { agendaTodayKey } from "./agenda-time";
import { isPlaybookEffectivelyActive } from "./lab-sheet-availability";
import type { AlertAgendaItem, Playbook } from "./types";

/** Hide today's rows for inactive playbooks; keep historical rows in the store */
export function filterAlertsByActivePlaybooks(
  items: AlertAgendaItem[],
  playbooks: Playbook[],
  viewDateKey: string,
): AlertAgendaItem[] {
  const todayKey = agendaTodayKey();
  const viewingToday = viewDateKey === todayKey;

  return items.filter((item) => {
    if (!item.playbookId) return true;
    if (!viewingToday) return true;

    const pb = playbooks.find((p) => p.id === item.playbookId);
    if (!pb) return false;
    return isPlaybookEffectivelyActive(pb);
  });
}
