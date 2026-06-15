"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProcurementHub } from "@/components/procurement/procurement-hub";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { canSeeProcurement } from "@/lib/role-access";
import { isCompanyFeedAvailable } from "@/lib/company-feed-visibility";

export default function ProcurementPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const domain = useSettingsStore((s) => s.domain);
  const phase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);
  const companyFeeds = useSettingsStore((s) => s.companyFeeds);
  const procurementFeedEnabled = isCompanyFeedAvailable("inventory", {
    companyFeeds,
    phrase2Enabled: phase2Enabled,
  });

  useEffect(() => {
    if (domain !== "ethanol") {
      router.replace("/");
      return;
    }
    if (!phase2Enabled || !procurementFeedEnabled) {
      router.replace("/playbooks");
      return;
    }
    if (user && !canSeeProcurement(user.role)) {
      router.replace("/");
    }
  }, [domain, phase2Enabled, procurementFeedEnabled, user, router]);

  if (domain !== "ethanol") return null;
  if (!phase2Enabled || !procurementFeedEnabled) return null;
  if (user && !canSeeProcurement(user.role)) return null;

  return <ProcurementHub />;
}
