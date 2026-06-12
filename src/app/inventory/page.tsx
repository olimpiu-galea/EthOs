"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InventoryHub } from "@/components/inventory/inventory-hub";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { canSeeInventory } from "@/lib/role-access";

export default function InventoryPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const domain = useSettingsStore((s) => s.domain);
  const phase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);

  useEffect(() => {
    if (domain !== "ethanol") {
      router.replace("/");
      return;
    }
    if (!phase2Enabled) {
      router.replace("/playbooks");
      return;
    }
    if (user && !canSeeInventory(user.role)) {
      router.replace("/");
    }
  }, [domain, phase2Enabled, user, router]);

  if (domain !== "ethanol") return null;
  if (!phase2Enabled) return null;
  if (user && !canSeeInventory(user.role)) return null;

  return <InventoryHub />;
}
