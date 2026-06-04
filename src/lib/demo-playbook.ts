import type { Playbook } from "./types";
import { createEmptyCondition } from "./playbook-utils";
import { activateTagsForPlaybookConditions } from "./tag-activation";

/** ~1 alert per DCS refresh (~60s) when connected — for testing Agenda live */
export function createLiveDemoPlaybook(): Omit<Playbook, "id"> {
  const cond = createEmptyCondition();
  cond.rule = {
    signalId: "AG-2201/_.Run#Value",
    displayLabel: "AG-2201 Run",
    operator: ">",
    threshold: 0,
    aggregation: "instant",
  };

  return {
    name: "Demo — live alert each refresh",
    description:
      "Always true while AG-2201 is running. Fires on each signal refresh (~60s). Use to test Agenda live updates.",
    status: "active",
    conditions: [cond],
    matchMode: "all",
    alertCooldownMs: 50_000,
    alert: {
      type: "predefined",
      predefinedId: "info",
      title: "Info",
      message: "Demo live alert — signal refresh",
      severity: "info",
    },
  };
}

export const DEMO_PLAYBOOK_NAME = "Demo — live alert each refresh";

export function findDemoPlaybook(playbooks: Playbook[]): Playbook | undefined {
  return playbooks.find((p) => p.name === DEMO_PLAYBOOK_NAME);
}

export function isDemoPlaybook(playbook: Pick<Playbook, "name">): boolean {
  return playbook.name === DEMO_PLAYBOOK_NAME;
}

/** Ensures the live demo playbook exists and stays active. */
export async function ensureLiveDemoPlaybook(): Promise<Playbook> {
  const { usePlaybookStore } = await import("@/stores/playbook-store");
  const { runPlaybookBackfill } = await import("@/lib/run-playbook-backfill");
  const store = usePlaybookStore.getState();
  let demo = findDemoPlaybook(store.playbooks);

  if (!demo) {
    const data = createLiveDemoPlaybook();
    const id = store.addPlaybook(data);
    demo = { ...data, id };
    await runPlaybookBackfill(demo);
    return demo;
  }

  if (demo.status !== "active") {
    store.updatePlaybook(demo.id, { status: "active" });
    demo = { ...demo, status: "active" };
  }

  const { useDcsStore } = await import("@/stores/dcs-store");
  const { useTagActivationStore } = await import("@/stores/tag-activation-store");
  activateTagsForPlaybookConditions(
    demo.conditions,
    useDcsStore.getState().tags,
    useTagActivationStore.getState().setTagActive,
  );

  return demo;
}
