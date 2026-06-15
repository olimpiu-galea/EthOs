"use client";

import { useEffect, useState } from "react";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useAlertHistoryStore } from "@/stores/alert-history-store";
import { useAuthStore } from "@/stores/auth-store";
import { useSettingsStore } from "@/stores/settings-store";
import { useReportsStore } from "@/stores/reports-store";
import { usePurchasedPlaybooksStore } from "@/stores/purchased-playbooks-store";
import { useInventoryItemsStore } from "@/stores/inventory-items-store";
import { useAuditStore } from "@/stores/audit-store";
import { usePlaybookFeedbackStore } from "@/stores/playbook-feedback-store";
import { ensureDefaultPlaybooks } from "@/lib/default-playbooks";
import { purgeDemoPlaybooks } from "@/lib/demo-playbook";
import { autoConnectCompanyFeeds } from "@/lib/auto-connect-integrations";

const STORES = [
  usePlaybookStore,
  useAlertHistoryStore,
  useAuthStore,
  useSettingsStore,
  useReportsStore,
  usePurchasedPlaybooksStore,
  useInventoryItemsStore,
  useAuditStore,
  usePlaybookFeedbackStore,
] as const;

function waitForHydration(store: (typeof STORES)[number]): Promise<void> {
  if (store.persist.hasHydrated()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const unsub = store.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
    void store.persist.rehydrate();
  });
}

function allStoresHydrated(): boolean {
  return STORES.every((s) => s.persist.hasHydrated());
}

function runDeferredBootTasks() {
  const run = () => {
    void (async () => {
      await autoConnectCompanyFeeds();
      await purgeDemoPlaybooks();
      await ensureDefaultPlaybooks();
      await autoConnectCompanyFeeds();
    })();
  };

  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(run);
  } else {
    setTimeout(run, 0);
  }
}

export function StoreHydration({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && allStoresHydrated(),
  );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!allStoresHydrated()) {
        try {
          await Promise.all(STORES.map(waitForHydration));
        } catch {
          /* still show app */
        }
      }

      if (cancelled) return;
      setReady(true);
      runDeferredBootTasks();
    }

    void boot();

    const fallback = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 3000);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const reconnect = () => {
      void autoConnectCompanyFeeds();
    };

    const interval = setInterval(reconnect, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") reconnect();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ready]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
