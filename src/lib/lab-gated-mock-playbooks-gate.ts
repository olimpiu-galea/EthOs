import { isLabGatedMockPlaybook } from "@/lib/lab-sheet-availability";
import { isWorkspaceWatchBuiltinId } from "@/lib/workspace-watch-playbook-seed";

/** Keep all mock/builtin playbooks active and agenda alerts in sync. */
export async function applyLabGatedMockPlaybooksGate(): Promise<void> {
  const { usePlaybookStore } = await import("@/stores/playbook-store");
  const { syncMockPlaybookAlerts, isMockPlaybook } = await import(
    "@/lib/mock-playbook-alerts"
  );

  const store = usePlaybookStore.getState();

  for (const pb of store.playbooks.filter(isMockPlaybook)) {
    if (pb.status !== "active") {
      store.updatePlaybook(pb.id, { status: "active" });
    }

    const current =
      usePlaybookStore.getState().playbooks.find((p) => p.id === pb.id) ?? pb;
    await syncMockPlaybookAlerts({ ...current, status: "active" });
  }

  for (const pb of store.playbooks.filter(
    (p) =>
      p.builtinId &&
      !isMockPlaybook(p) &&
      !isWorkspaceWatchBuiltinId(p.builtinId),
  )) {
    if (pb.status !== "active") {
      store.updatePlaybook(pb.id, { status: "active" });
    }
  }
}

// Re-export for clarity at call sites that only gate lab-linked builtins.
export { isLabGatedMockPlaybook };
