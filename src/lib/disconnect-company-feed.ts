import type { SignalSource } from "@/lib/types";

/** Disconnect a live integration when its company feed is turned off. */
export async function disconnectCompanyFeed(feed: SignalSource): Promise<void> {
  switch (feed) {
    case "dcs": {
      const { useDcsStore } = await import("@/stores/dcs-store");
      if (useDcsStore.getState().connected) {
        useDcsStore.getState().disconnect();
      }
      break;
    }
    case "lab": {
      const { useLabStore } = await import("@/stores/lab-store");
      if (useLabStore.getState().connected) {
        useLabStore.getState().disconnect();
      }
      break;
    }
    case "commodity": {
      const { useCommodityStore } = await import("@/stores/commodity-store");
      if (useCommodityStore.getState().connected) {
        useCommodityStore.getState().disconnect();
      }
      break;
    }
    case "inventory": {
      const { useInventoryStore } = await import("@/stores/inventory-store");
      if (useInventoryStore.getState().connected) {
        useInventoryStore.getState().disconnect();
      }
      break;
    }
  }
}
