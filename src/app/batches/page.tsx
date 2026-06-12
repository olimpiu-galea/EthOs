"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BatchesHub2030 } from "@/components/batches/batches-hub-2030";
import { useSettingsStore } from "@/stores/settings-store";

export default function BatchesPage() {
  const router = useRouter();
  const phase2Enabled = useSettingsStore((s) => s.operationsSuiteEnabled);
  const domain = useSettingsStore((s) => s.domain);

  useEffect(() => {
    if (domain !== "ethanol" || !phase2Enabled) {
      router.replace("/playbooks");
    }
  }, [domain, phase2Enabled, router]);

  if (domain !== "ethanol" || !phase2Enabled) return null;

  return (
    <Suspense
      fallback={<div className="p-8 text-muted-foreground">Loading batches…</div>}
    >
      <BatchesHub2030 />
    </Suspense>
  );
}
