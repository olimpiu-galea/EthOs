import type { PlaybookActionItem, PlaybookGuidanceStep } from "./types";

export const DAILY_DEMO_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "review-batch",
    title: "Review batch on Ferm B",
    detail:
      "Open the batch workspace and confirm fermenter temperature, agitator, and cooling are responding as expected.",
  },
  {
    id: "compare-signals",
    title: "Compare live signals with lab data",
    detail:
      "Check the latest lab sheet row against DCS tags for this fermenter before changing any setpoints.",
  },
  {
    id: "corrective-action",
    title: "Take corrective action",
    detail:
      "If cooling is lagging, adjust per plant SOP and watch the trend for the next 30 minutes.",
  },
  {
    id: "log-and-close",
    title: "Log outcome and resolve",
    detail:
      "Record what you changed and mark the alert resolved once the batch is back in a stable range.",
  },
];

export const DAILY_DEMO_GUIDANCE: PlaybookGuidanceStep[] = [
  {
    title: "Sample alert for demos",
    body: "This is a fixed daily example on the Agenda — use it to walk through action items, guidance, comments, and resolve flow.",
  },
  {
    title: "Treat it like a live alert",
    body: "Work through each action item in order. The detail panel shows batch context and steps the same way as production playbooks.",
  },
  {
    title: "Resolve when done",
    body: "Mark resolved after logging your review. A fresh instance appears on the next calendar day.",
  },
];
