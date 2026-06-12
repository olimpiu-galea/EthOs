import type { Playbook } from "./types";

import { playbookCooldownMs } from "./types";

import type { DcsTimeline } from "./dcs-timeline";

import {

  appendMinuteToBuffers,

  resolveSourceTimelineDay,

  tagsAtMinute,

  timestampOnDate,

} from "./dcs-timeline";

import type { TagBufferMap } from "./rule-evaluator";

import {
  conditionsPreviewForPlaybook,
  evaluatePlaybookConditions,
} from "./rule-evaluator";

import { MOCK_BATCHES } from "./batch-fixture-data";

import { buildBatchContext } from "./batch-context";



export type BacktestHit = {

  dayOffset: number;

  triggeredAt: number;

  dayLabel: string;

  alertTitle: string;

  alertMessage: string;

  batchId?: string;

  fermenter?: string;

  phaseLabel?: string;

  conditionsSummary: string;

};



export type BacktestResult = {

  hits: number;

  events: BacktestHit[];

  avgPerDay: number;

  peakDay: string;

};



type MockBacktestInput = Pick<

  Playbook,

  | "name"
  | "alert"
  | "conditions"
  | "matchMode"
  | "conditionGroups"
  | "groupMatchMode"

> & {

  conditionsSummary?: string;

};



const BATCH_ROTATION = MOCK_BATCHES.map((b) => buildBatchContext(b)).filter(

  (b): b is NonNullable<typeof b> => Boolean(b),

);



/** Demo backtest — fixture replay simulation for UI preview */

export function mockBacktestResult(

  playbook?: MockBacktestInput,

  now: number = Date.now(),

): BacktestResult {

  const hitsPerDay = [2, 3, 1, 4, 2, 1, 3];

  const events: BacktestHit[] = [];

  let peakDay = "";

  let peakCount = 0;



  const alertTitle = playbook?.alert.title?.trim() || "Alert";

  const alertMessage =

    playbook?.alert.message?.trim() || "Operator action required";

  const conditionsSummary =

    playbook?.conditionsSummary?.trim() ||

    (playbook ? conditionsPreviewForPlaybook(playbook) : "") ||

    "Conditions met";



  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {

    const baseDate = new Date(now);

    baseDate.setDate(baseDate.getDate() - dayOffset);

    const dayLabel = baseDate.toLocaleDateString(undefined, {

      weekday: "short",

      month: "short",

      day: "numeric",

    });

    const count = hitsPerDay[6 - dayOffset];

    if (count > peakCount) {

      peakCount = count;

      peakDay = dayLabel;

    }

    for (let i = 0; i < count; i++) {

      const ts = new Date(baseDate);

      ts.setHours(6 + i * 4, 12 + i * 7, 0, 0);

      const batch =

        BATCH_ROTATION[(events.length + i) % BATCH_ROTATION.length];

      events.push({

        dayOffset,

        dayLabel,

        triggeredAt: ts.getTime(),

        alertTitle,

        alertMessage,

        batchId: batch?.batchId,

        fermenter: batch?.fermenter,

        phaseLabel: batch?.phaseLabel,

        conditionsSummary,

      });

    }

  }



  events.sort((a, b) => b.triggeredAt - a.triggeredAt);



  return {

    hits: events.length,

    events,

    avgPerDay: Math.round((events.length / 7) * 10) / 10,

    peakDay,

  };

}



export function backfillPlaybookAlerts7Days(

  playbook: Playbook,

  timeline: DcsTimeline,

  now: number = Date.now(),

): Pick<BacktestResult, "hits" | "events"> {

  const sourceKey = resolveSourceTimelineDay(timeline);

  const day = timeline.days[sourceKey];

  if (!day) return { hits: 0, events: [] };



  const cooldownMs = playbookCooldownMs(playbook);

  const events: BacktestHit[] = [];

  const endMinute = day.minutes - 1;

  const conditionsSummary = conditionsPreviewForPlaybook(playbook);



  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {

    const baseDate = new Date(now);

    baseDate.setDate(baseDate.getDate() - dayOffset);

    const dayKey = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, "0")}-${String(baseDate.getDate()).padStart(2, "0")}`;

    const dayLabel = baseDate.toLocaleDateString(undefined, {

      weekday: "short",

      month: "short",

      day: "numeric",

    });



    let lastFire = 0;

    let buffers: TagBufferMap = {};



    for (let m = 0; m <= endMinute; m++) {

      const ts = timestampOnDate(dayKey, m);

      const tags = tagsAtMinute(timeline, sourceKey, m);

      buffers = appendMinuteToBuffers(buffers, tags, ts);



      if (ts - lastFire < cooldownMs) continue;



      const fired = evaluatePlaybookConditions(

        playbook,

        tags,

        buffers,

        ts,

      );



      if (!fired) continue;



      lastFire = ts;

      const batch =

        BATCH_ROTATION[events.length % BATCH_ROTATION.length];

      events.push({

        dayOffset,

        triggeredAt: ts,

        dayLabel,

        alertTitle: playbook.alert.title,

        alertMessage: playbook.alert.message,

        batchId: batch?.batchId,

        fermenter: batch?.fermenter,

        phaseLabel: batch?.phaseLabel,

        conditionsSummary,

      });

    }

  }



  return { hits: events.length, events };

}


