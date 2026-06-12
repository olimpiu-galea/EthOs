import type { UserRole } from "@/lib/types";
import {
  signalFeedsForRole,
  shouldAutoConnectIntegrations,
} from "@/lib/role-access";
import { SKIP_INTEGRATION_AUTO_CONNECT_KEY } from "@/lib/reset-lakeview-workspace";

/** Connect signal feeds required for the signed-in role (no Integrations UI). */
export async function autoConnectIntegrationsForRole(role: UserRole): Promise<void> {
  if (
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(SKIP_INTEGRATION_AUTO_CONNECT_KEY)
  ) {
    sessionStorage.removeItem(SKIP_INTEGRATION_AUTO_CONNECT_KEY);
    return;
  }

  if (!shouldAutoConnectIntegrations(role)) return;

  const feeds = signalFeedsForRole(role);
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
  if (
    feeds.includes("dcs") &&
    companyFeeds.dcs &&
    !useDcsStore.getState().connected
  ) {
    tasks.push(useDcsStore.getState().connect());
  }
  if (
    feeds.includes("lab") &&
    companyFeeds.lab &&
    !useLabStore.getState().connected
  ) {
    tasks.push(useLabStore.getState().connect());
  }
  if (
    phrase2Active &&
    feeds.includes("commodity") &&
    companyFeeds.commodity &&
    !useCommodityStore.getState().connected
  ) {
    tasks.push(useCommodityStore.getState().connect());
  }
  if (
    phrase2Active &&
    feeds.includes("inventory") &&
    companyFeeds.inventory &&
    !useInventoryStore.getState().connected
  ) {
    tasks.push(useInventoryStore.getState().connect());
  }

  await Promise.all(tasks);
}
