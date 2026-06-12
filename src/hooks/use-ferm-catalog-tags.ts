"use client";

import { useEffect, useState } from "react";
import type { DcsTagWithKey } from "@/lib/types";
import { loadFermCatalogTags } from "@/lib/ferm-catalog";

export function useFermCatalogTags(): {
  tags: DcsTagWithKey[];
  ready: boolean;
} {
  const [tags, setTags] = useState<DcsTagWithKey[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadFermCatalogTags()
      .then((list) => {
        if (!cancelled) {
          setTags(list);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTags([]);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { tags, ready };
}
