import { isLabSheetReady } from "@/lib/lab-sheet-availability";

export async function applyLabGatedMockPlaybooksGate(): Promise<void> {
  const { usePlaybookStore } = await import("@/stores/playbook-store");
  const { syncMockPlaybookAlerts, isMockPlaybook } = await import(
    "@/lib/mock-playbook-alerts"
  );

  const store = usePlaybookStore.getState();
  const ready = isLabSheetReady();

  for (const pb of store.playbooks.filter(isMockPlaybook)) {
    if (!ready) {
      if (pb.status === "active") {
        store.updatePlaybook(pb.id, { status: "disabled" });
      }
      await syncMockPlaybookAlerts({ ...pb, status: "disabled" });
      continue;
    }

    if (pb.status !== "active") {
      store.updatePlaybook(pb.id, { status: "active" });
    }

    const current =
      usePlaybookStore.getState().playbooks.find((p) => p.id === pb.id) ?? pb;
    await syncMockPlaybookAlerts({ ...current, status: "active" });
  }
}
