"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InventoryHub } from "@/components/inventory/inventory-hub";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { canSeeInventory } from "@/lib/role-access";
import { isCompanyFeedAvailable } from "@/lib/company-feed-visibility";

export default function InventoryPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const domain = useSettingsStore((s) => s.domain);
  const phase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);
  const companyFeeds = useSettingsStore((s) => s.companyFeeds);
  const inventoryFeedEnabled = isCompanyFeedAvailable("inventory", {
    companyFeeds,
    phrase2Enabled: phase2Enabled,
  });

  useEffect(() => {
    if (domain !== "ethanol") {
      router.replace("/");
      return;
    }
    if (!phase2Enabled || !inventoryFeedEnabled) {
      router.replace("/playbooks");
      return;
    }
    if (user && !canSeeInventory(user.role)) {
      router.replace("/");
    }
  }, [domain, phase2Enabled, inventoryFeedEnabled, user, router]);

  if (domain !== "ethanol") return null;
  if (!phase2Enabled || !inventoryFeedEnabled) return null;
  if (user && !canSeeInventory(user.role)) return null;

  return <InventoryHub />;
}
