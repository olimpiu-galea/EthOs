"use client";

import { create } from "zustand";
import { parseDcsCsv, numericValue } from "@/lib/dcs-parser";
import type { DcsTagWithKey } from "@/lib/types";
import {
  loadLabFixtureFields,
  parseLabUploadCsv,
  type LabFieldSchema,
} from "@/lib/lab-sheet";

const REFRESH_MS = 60_000;

type LabState = {
  connected: boolean;
  schema: LabFieldSchema[];
  tags: DcsTagWithKey[];
  lastSync: number | null;
  lastUploadName: string | null;
  error: string | null;
  uploadError: string | null;
  loading: boolean;
  refreshTimer: ReturnType<typeof setInterval> | null;
  connect: (schema?: LabFieldSchema[]) => Promise<void>;
  disconnect: () => void;
  refreshValues: () => void;
  uploadSheet: (file: File) => Promise<boolean>;
};

function jitter(tag: DcsTagWithKey): number {
  const base = numericValue(tag.value);
  const span = Math.max(Math.abs(base) * 0.05, 0.05);
  return Math.round((base + (Math.random() - 0.5) * span) * 100) / 100;
}

function filterTagsBySchema(
  tags: DcsTagWithKey[],
  schema: LabFieldSchema[],
): DcsTagWithKey[] {
  if (schema.length === 0) return tags;
  const allowed = new Set(schema.map((f) => f.id));
  return tags.filter((t) => allowed.has(t.id));
}

async function loadFixtureTags(schema: LabFieldSchema[]): Promise<DcsTagWithKey[]> {
  const res = await fetch("/fixtures/ferm-data-sheet.csv");
  if (!res.ok) throw new Error("Failed to load lab sheet fixture.");
  const text = await res.text();
  const tags = parseDcsCsv(text).map((t) => ({
    ...t,
    source: "lab" as const,
  }));
  return filterTagsBySchema(tags, schema);
}

export const useLabStore = create<LabState>((set, get) => ({
  connected: false,
  schema: [],
  tags: [],
  lastSync: null,
  lastUploadName: null,
  error: null,
  uploadError: null,
  loading: false,
  refreshTimer: null,

  connect: async (schema) => {
    set({ loading: true, error: null, uploadError: null });
    try {
      const fields = schema ?? (await loadLabFixtureFields());
      const tags = await loadFixtureTags(fields);

      const existing = get().refreshTimer;
      if (existing) clearInterval(existing);
      const timer = setInterval(() => get().refreshValues(), REFRESH_MS);

      set({
        connected: true,
        schema: fields,
        tags,
        lastSync: Date.now(),
        loading: false,
        refreshTimer: timer,
      });

      const { applyLabGatedMockPlaybooksGate } = await import(
        "@/lib/lab-gated-mock-playbooks-gate"
      );
      await applyLabGatedMockPlaybooksGate();

    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Connection failed",
        connected: false,
      });
    }
  },

  disconnect: () => {
    const timer = get().refreshTimer;
    if (timer) clearInterval(timer);
    set({
      connected: false,
      schema: [],
      tags: [],
      lastSync: null,
      lastUploadName: null,
      error: null,
      uploadError: null,
      refreshTimer: null,
    });
    void import("@/lib/lab-gated-mock-playbooks-gate").then(
      ({ applyLabGatedMockPlaybooksGate }) => applyLabGatedMockPlaybooksGate(),
    );
  },

  refreshValues: () => {
    const { connected, tags } = get();
    if (!connected) return;
    set({
      tags: tags.map((t) => ({
        ...t,
        value:
          t.fieldType.toLowerCase().includes("digital") ||
          numericValue(t.value) === 0 ||
          numericValue(t.value) === 1
            ? t.value
            : jitter(t),
      })),
      lastSync: Date.now(),
    });
  },

  uploadSheet: async (file) => {
    const { schema, connected } = get();
    if (!connected || schema.length === 0) return false;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      set({
        uploadError:
          "Save your workbook as CSV (UTF-8) from Excel — structure must match mapped fields.",
      });
      return false;
    }

    try {
      const text = await file.text();
      const { tags, error } = parseLabUploadCsv(text, schema);
      if (error) {
        set({ uploadError: error });
        return false;
      }
      set({
        tags,
        lastSync: Date.now(),
        lastUploadName: file.name,
        uploadError: null,
      });
      return true;
    } catch {
      set({ uploadError: "Could not read file." });
      return false;
    }
  },
}));
