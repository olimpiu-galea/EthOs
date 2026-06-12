"use client";

import { create } from "zustand";
import { parseDcsCsv, numericValue, tagKey } from "@/lib/dcs-parser";
import type { DcsTagWithKey } from "@/lib/types";
import type { TagBufferMap } from "@/lib/rule-evaluator";
import { trimBuffer, frequencyToMs } from "@/lib/rule-evaluator";
import type { DcsTimeline } from "@/lib/dcs-timeline";
import {
  buildBuffersUpToForDisplay,
  currentMinuteIndexForDate,
  localDateKey,
  resolveSourceTimelineDay,
  syncTagsToMinute,
} from "@/lib/dcs-timeline";
import { schedulePlaybookHistorySync } from "@/lib/sync-playbook-history";
import { usePlaybookStore } from "@/stores/playbook-store";

const REFRESH_MS = 60_000;
const SIX_H_MS = 6 * 60 * 60 * 1000;

type DcsState = {
  connected: boolean;
  tags: DcsTagWithKey[];
  buffers: TagBufferMap;
  timeline: DcsTimeline | null;
  timelineDateKey: string;
  lastSync: number | null;
  error: string | null;
  loading: boolean;
  historySyncing: boolean;
  refreshTimer: ReturnType<typeof setInterval> | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshValues: () => void;
  getTimeline: () => DcsTimeline | null;
};

function jitterValue(tag: DcsTagWithKey): number {
  const base = numericValue(tag.value);
  const isDigital =
    tag.fieldType.toLowerCase().includes("digital") ||
    typeof tag.value === "boolean" ||
    (base === 0 || base === 1);

  if (isDigital) {
    return Math.random() > 0.92 ? (base === 1 ? 0 : 1) : base;
  }

  const span = Math.max(Math.abs(base) * 0.08, 1);
  const next = base + (Math.random() - 0.5) * span;
  return Math.round(next * 100) / 100;
}

function appendBuffers(
  tags: DcsTagWithKey[],
  buffers: TagBufferMap,
  now: number,
): TagBufferMap {
  const next: TagBufferMap = { ...buffers };

  for (const tag of tags) {
    const key = tagKey(tag);
    const freqMs = frequencyToMs(tag.frequency);
    const maxAge = Math.max(SIX_H_MS, freqMs * 360);
    const existing = next[key] ?? [];
    const val = numericValue(tag.value);
    const updated = trimBuffer(
      [...existing, { value: val, timestamp: now }],
      maxAge,
      now,
    );
    next[key] = updated;
  }

  return next;
}

function applyTimelineMinute(
  tags: DcsTagWithKey[],
  timeline: DcsTimeline,
  displayDateKey: string,
  now: number,
): { tags: DcsTagWithKey[]; buffers: TagBufferMap; lastSync: number } {
  const sourceKey = resolveSourceTimelineDay(timeline);
  const day = timeline.days[sourceKey];
  if (!day) {
    return { tags, buffers: appendBuffers(tags, {}, now), lastSync: now };
  }

  const minuteIdx = currentMinuteIndexForDate(displayDateKey, now, day.minutes);
  const synced = syncTagsToMinute(tags, timeline, sourceKey, minuteIdx);
  const buffers = buildBuffersUpToForDisplay(
    timeline,
    sourceKey,
    displayDateKey,
    minuteIdx,
  );
  const lastSync = now;

  return { tags: synced, buffers, lastSync };
}

export const useDcsStore = create<DcsState>((set, get) => ({
  connected: false,
  tags: [],
  buffers: {},
  timeline: null,
  timelineDateKey: localDateKey(),
  lastSync: null,
  error: null,
  loading: false,
  historySyncing: false,
  refreshTimer: null,

  getTimeline: () => get().timeline,

  connect: async () => {
    set({ loading: true, error: null });
    try {
      const [csvRes, timelineRes] = await Promise.all([
        fetch("/fixtures/dcs-tags.csv"),
        fetch("/fixtures/dcs-tags-timeline.json"),
      ]);
      if (!csvRes.ok) throw new Error("Failed to load DCS fixture.");
      if (!timelineRes.ok) throw new Error("Failed to load DCS timeline.");

      const text = await csvRes.text();
      const tags = parseDcsCsv(text);
      const timeline = (await timelineRes.json()) as DcsTimeline;
      const dateKey = localDateKey();
      const now = Date.now();

      const { tags: synced, buffers, lastSync } = applyTimelineMinute(
        tags,
        timeline,
        dateKey,
        now,
      );

      const existing = get().refreshTimer;
      if (existing) clearInterval(existing);

      const timer = setInterval(() => {
        get().refreshValues();
      }, REFRESH_MS);

      set({
        connected: true,
        tags: synced,
        buffers,
        timeline,
        timelineDateKey: dateKey,
        lastSync,
        loading: false,
        refreshTimer: timer,
      });

      const playbooks = usePlaybookStore.getState().playbooks;
      if (playbooks.length > 0) {
        set({ historySyncing: true });
        schedulePlaybookHistorySync(timeline, () => {
          set({ historySyncing: false });
        });
      }

    } catch (e) {
      set({
        loading: false,
        historySyncing: false,
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
      tags: [],
      buffers: {},
      timeline: null,
      lastSync: null,
      error: null,
      historySyncing: false,
      refreshTimer: null,
    });
  },

  refreshValues: () => {
    const { connected, tags, buffers, timeline, timelineDateKey } = get();
    if (!connected || tags.length === 0) return;

    const now = Date.now();

    const sourceKey = timeline ? resolveSourceTimelineDay(timeline) : null;
    if (timeline && sourceKey && timeline.days[sourceKey]) {
      const applied = applyTimelineMinute(
        tags,
        timeline,
        timelineDateKey,
        now,
      );
      set({
        tags: applied.tags,
        buffers: applied.buffers,
        lastSync: applied.lastSync,
      });
      return;
    }

    const updatedTags = tags.map((t) => ({
      ...t,
      value: jitterValue(t),
    }));

    set({
      tags: updatedTags,
      buffers: appendBuffers(updatedTags, buffers, now),
      lastSync: now,
    });
  },
}));
