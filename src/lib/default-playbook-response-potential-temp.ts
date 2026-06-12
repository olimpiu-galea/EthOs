import type { PlaybookActionItem, PlaybookGuidanceStep } from "./types";

export const POTENTIAL_VS_TEMP_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "review-potential",
    title: "Review potential trajectory",
    detail:
      "Compare potential at the reference hour against the band for this checkpoint. Note sugars and ethanol contribution.",
  },
  {
    id: "check-temp",
    title: "Verify fermenter temperature",
    detail:
      "Confirm live temp at the checkpoint hour against the cap from the classification table.",
  },
  {
    id: "stabilize",
    title: "Apply temperature correction",
    detail:
      "If above cap, adjust cooling setpoint per SOP and monitor for 30 minutes.",
  },
  {
    id: "escalate",
    title: "Escalate off-spec batches",
    detail:
      "For potential-only bad signals or missing readings, notify QA and shift lead before advancing the batch.",
  },
];

export const POTENTIAL_VS_TEMP_GUIDANCE: PlaybookGuidanceStep[] = [
  {
    title: "Read the checkpoint table",
    body: "Each fermentation hour uses potential from the prior reference hour to set a temperature cap. Match the batch to the correct row before acting.",
  },
  {
    title: "Potential-only flags",
    body: "When the action is “No clear action”, the batch is still flagged as generally bad — temperature at that hour is not the primary decision point.",
  },
  {
    title: "Document",
    body: "Log potential, temp, and the rule that fired in the batch record for QA traceability.",
  },
];
