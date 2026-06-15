import type { PlaybookActionItem, PlaybookGuidanceStep } from "./types";

export const POTENTIAL_VS_TEMP_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "review-potential",
    title: "Review potential trajectory",
    detail: "Compare potential at reference hour to band; note sugars/ethanol.",
  },
  {
    id: "check-temp",
    title: "Verify fermenter temperature",
    detail: "Confirm live temp vs cap from classification table.",
  },
  {
    id: "stabilize",
    title: "Apply temperature correction",
    detail: "If above cap, adjust cooling per SOP; monitor 30 min.",
  },
  {
    id: "escalate",
    title: "Escalate off-spec batches",
    detail: "Notify QA and shift lead before advancing batch.",
  },
];

export const POTENTIAL_VS_TEMP_GUIDANCE: PlaybookGuidanceStep[] = [
  {
    title: "Checkpoint table",
    body: "Match batch to correct row before acting on temp cap.",
  },
  {
    title: "Potential-only flags",
    body: "No clear action still flags batch as generally bad.",
  },
  {
    title: "Document",
    body: "Log potential, temp, and rule fired for QA.",
  },
];
