import type { PlaybookActionItem, PlaybookGuidanceStep } from "./types";

export const ACETIC_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "review-acetic",
    title: "Review acetic trajectory",
    detail: "Compare acetic at checkpoint to threshold; note yeast health.",
  },
  {
    id: "check-secondary",
    title: "Verify secondary indicator",
    detail: "YP–6h: cell count. 12h–50h: potential at same checkpoint.",
  },
  {
    id: "escalate-supervisor",
    title: "Escalate to supervisor",
    detail: "Infection-risk flags — notify shift lead and QA per SOP.",
  },
  {
    id: "document",
    title: "Document cluster match",
    detail: "Log acetic, secondary reading, and rule row fired.",
  },
];

export const ACETIC_GUIDANCE: PlaybookGuidanceStep[] = [
  {
    title: "Bad-batch clusters",
    body: "Historical bad-batch patterns — informative, not auto hold/dump.",
  },
  {
    title: "YP and 6h checkpoints",
    body: "Early rows pair acetic with yeast cell count.",
  },
  {
    title: "12h through 50h",
    body: "Later rows pair acetic with potential at same hour.",
  },
];
