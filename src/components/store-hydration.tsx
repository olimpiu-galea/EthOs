"use client";

import { useEffect, useState } from "react";
import { usePlaybookStore } from "@/stores/playbook-store";
import { useAlertHistoryStore } from "@/stores/alert-history-store";
import { ensureLiveDemoPlaybook } from "@/lib/demo-playbook";

export function StoreHydration({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = 0;
    const check = () => {
      done += 1;
      if (done >= 2) {
        void ensureLiveDemoPlaybook().finally(() => setReady(true));
      }
    };

    const unsubP = usePlaybookStore.persist.onFinishHydration(check);
    const unsubA = useAlertHistoryStore.persist.onFinishHydration(check);

    void usePlaybookStore.persist.rehydrate();
    void useAlertHistoryStore.persist.rehydrate();

    return () => {
      unsubP();
      unsubA();
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
