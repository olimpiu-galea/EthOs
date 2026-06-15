import type { PlaybookActionItem, PlaybookGuidanceStep } from "./types";

export const DAILY_DEMO_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "review-batch",
    title: "Review batch on Ferm B",
    detail: "Confirm temp, agitator, and cooling in batch workspace.",
  },
  {
    id: "compare-signals",
    title: "Compare live signals with lab data",
    detail: "Match latest lab row to DCS tags before setpoint changes.",
  },
  {
    id: "corrective-action",
    title: "Take corrective action",
    detail: "Adjust cooling per SOP; watch trend 30 min.",
  },
  {
    id: "log-and-close",
    title: "Log outcome and resolve",
    detail: "Record changes and resolve when batch is stable.",
  },
];

export const DAILY_DEMO_GUIDANCE: PlaybookGuidanceStep[] = [
  {
    title: "Demo alert",
    body: "Fixed daily example — walk items, guidance, and resolve.",
  },
  {
    title: "Work like live",
    body: "Complete action items in order from the detail panel.",
  },
  {
    title: "Resolve when done",
    body: "Mark resolved after logging; new instance next day.",
  },
];
