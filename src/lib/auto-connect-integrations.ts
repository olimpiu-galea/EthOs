import type { UserRole } from "@/lib/types";
import { SKIP_INTEGRATION_AUTO_CONNECT_KEY } from "@/lib/reset-lakeview-workspace";

/** Connect all company-enabled signal feeds (respects Phrase 2 for commodity/procurement). */
export async function autoConnectCompanyFeeds(): Promise<void> {
  if (
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(SKIP_INTEGRATION_AUTO_CONNECT_KEY)
  ) {
    sessionStorage.removeItem(SKIP_INTEGRATION_AUTO_CONNECT_KEY);
    return;
  }

  const [
    { useDcsStore },
    { useLabStore },
    { useCommodityStore },
    { useInventoryStore },
    { useSettingsStore },
  ] = await Promise.all([
    import("@/stores/dcs-store"),
    import("@/stores/lab-store"),
    import("@/stores/commodity-store"),
    import("@/stores/inventory-store"),
    import("@/stores/settings-store"),
  ]);

  const { operationsSuiteEnabled: phrase2Active, companyFeeds } =
    useSettingsStore.getState();

  const tasks: Promise<void>[] = [];
  if (companyFeeds.dcs && !useDcsStore.getState().connected) {
    tasks.push(useDcsStore.getState().connect());
  }
  if (companyFeeds.lab && !useLabStore.getState().connected) {
    tasks.push(useLabStore.getState().connect());
  }
  if (
    phrase2Active &&
    companyFeeds.commodity &&
    !useCommodityStore.getState().connected
  ) {
    tasks.push(useCommodityStore.getState().connect());
  }
  if (
    phrase2Active &&
    companyFeeds.inventory &&
    !useInventoryStore.getState().connected
  ) {
    tasks.push(useInventoryStore.getState().connect());
  }

  await Promise.all(tasks);
}

export async function autoConnectIntegrationsForRole(
  _role: UserRole,
): Promise<void> {
  await autoConnectCompanyFeeds();
}
