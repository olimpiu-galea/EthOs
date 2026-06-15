import { clearPersistedAppStorage } from "@/lib/clear-app-storage";
import { DEFAULT_COMPANY } from "@/lib/auth-constants";
import { DEFAULT_COMPANY_FEEDS } from "@/lib/company-features";
import { DEFAULT_REPORT_TEMPLATES } from "@/stores/settings-store";

export const SKIP_INTEGRATION_AUTO_CONNECT_KEY =
  "signal-relay-skip-integration-auto-connect";

export const REQUIRE_ONBOARDING_KEY = "signal-relay-require-onboarding";

export function isOnboardingRequiredAfterReset(): boolean {
  return (
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(REQUIRE_ONBOARDING_KEY) === "1"
  );
}

export function markOnboardingRequiredAfterReset(): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(REQUIRE_ONBOARDING_KEY, "1");
  }
}

export function clearOnboardingRequiredAfterReset(): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(REQUIRE_ONBOARDING_KEY);
  }
}

/** Wipe Lakeview demo workspace — playbooks, agenda, integrations, settings */
export async function resetLakeviewWorkspace(): Promise<void> {
  clearPersistedAppStorage();

  const { usePlaybookStore } = await import("@/stores/playbook-store");
  const { useAlertHistoryStore } = await import("@/stores/alert-history-store");
  const { useSettingsStore } = await import("@/stores/settings-store");
  const { useAuthStore } = await import("@/stores/auth-store");
  const { useDcsStore } = await import("@/stores/dcs-store");
  const { useLabStore } = await import("@/stores/lab-store");
  const { useCommodityStore } = await import("@/stores/commodity-store");
  const { useInventoryStore } = await import("@/stores/inventory-store");
  const { useReportsStore } = await import("@/stores/reports-store");
  const { useMarginDecisionsStore } = await import(
    "@/stores/margin-decisions-store"
  );
  const { usePurchasedPlaybooksStore } = await import(
    "@/stores/purchased-playbooks-store"
  );
  const { useAuditStore } = await import("@/stores/audit-store");
  const { usePlaybookFeedbackStore } = await import(
    "@/stores/playbook-feedback-store"
  );
  const { useTagActivationStore } = await import(
    "@/stores/tag-activation-store"
  );
  const { useInventoryItemsStore } = await import(
    "@/stores/inventory-items-store"
  );

  useDcsStore.getState().disconnect();
  useLabStore.getState().disconnect();
  useCommodityStore.getState().disconnect();
  useInventoryStore.getState().disconnect();

  usePlaybookStore.setState({ playbooks: [] });
  useAlertHistoryStore.setState({ items: [] });
  useReportsStore.setState({ documents: [] });
  useMarginDecisionsStore.setState({ decisions: [] });
  usePurchasedPlaybooksStore.setState({ purchasedIds: [] });
  useAuditStore.setState({ events: [] });
  usePlaybookFeedbackStore.setState({ items: [] });
  useTagActivationStore.setState({ inactiveTagKeys: [] });
  useInventoryItemsStore.getState().resetToSeed();

  const registeredLakeview = useAuthStore
    .getState()
    .users.filter((u) => u.companyId === DEFAULT_COMPANY.id);
  for (const u of registeredLakeview) {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(`signal-relay-pw-${u.id}`);
    }
  }

  useAuthStore.setState((s) => ({
    users: s.users.filter((u) => u.companyId !== DEFAULT_COMPANY.id),
    user: null,
    onboardingComplete: false,
  }));

  useSettingsStore.setState((s) => ({
    companyId: DEFAULT_COMPANY.id,
    companyName: DEFAULT_COMPANY.name,
    domain: "ethanol",
    operationsSuiteEnabled: true,
    companyFeeds: { ...DEFAULT_COMPANY_FEEDS },
    companyFeedsByCompany: {
      ...s.companyFeedsByCompany,
      [DEFAULT_COMPANY.id]: { ...DEFAULT_COMPANY_FEEDS },
    },
    teams: [],
    teamsByCompany: {
      ...s.teamsByCompany,
      [DEFAULT_COMPANY.id]: [],
    },
    reportTemplates: DEFAULT_REPORT_TEMPLATES.map((t) => ({ ...t })),
  }));

  const { ensureDefaultPlaybooks } = await import("@/lib/default-playbooks");
  await ensureDefaultPlaybooks();

  markOnboardingRequiredAfterReset();
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(SKIP_INTEGRATION_AUTO_CONNECT_KEY, "1");
  }

  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}
