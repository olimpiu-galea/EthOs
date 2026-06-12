import type { PlaybookActionItem, PlaybookGuidanceStep } from "./types";

export const ACETIC_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "review-acetic",
    title: "Review acetic trajectory",
    detail:
      "Compare acetic acid at the checkpoint against the classification threshold. Note yeast health indicators.",
  },
  {
    id: "check-secondary",
    title: "Verify secondary indicator",
    detail:
      "For YP–6h rows, confirm cell count. For 12h–50h rows, confirm potential at the same checkpoint.",
  },
  {
    id: "escalate-supervisor",
    title: "Escalate to supervisor",
    detail:
      "Infection-risk clusters are descriptive flags from bad-batch history — notify shift lead and QA per SOP.",
  },
  {
    id: "document",
    title: "Document cluster match",
    detail:
      "Log acetic, secondary reading, and the rule row that fired. This playbook is informative, not an action-cap trigger.",
  },
];

export const ACETIC_GUIDANCE: PlaybookGuidanceStep[] = [
  {
    title: "Bad-batch clusters",
    body: "Rules describe batches that clustered as bad in historical data. They flag infection risk patterns — not automatic hold/dump actions.",
  },
  {
    title: "YP and 6h checkpoints",
    body: "Early rows pair acetic acid with yeast cell count. Higher acetic with low cell count increases risk weight.",
  },
  {
    title: "12h through 50h",
    body: "Later rows pair acetic with potential at the same hour. Batches with Temp at 6h > 91.0 were excluded in the source analysis.",
  },
];
