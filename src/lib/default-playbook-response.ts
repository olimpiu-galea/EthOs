import type { PlaybookActionItem, PlaybookGuidanceStep } from "./types";

export const DEFAULT_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "ack",
    title: "Acknowledge at panel",
    detail:
      "Confirm the alarm on DCS and note the exact timestamp in the shift log.",
  },
  {
    id: "verify",
    title: "Verify live reading",
    detail:
      "Cross-check the triggering tag against the historian trend — rule out a bad transmitter.",
  },
  {
    id: "stabilize",
    title: "Apply first corrective step",
    detail:
      "Follow the unit SOP: adjust setpoint, open/close valve, or call field if confirmed out of range.",
  },
  {
    id: "escalate",
    title: "Escalate if not normal in 15 min",
    detail:
      "Notify shift lead and maintenance if the condition persists after the first intervention.",
  },
  {
    id: "document",
    title: "Log deviation & close loop",
    detail:
      "Record root cause, actions taken, and return-to-normal time for the batch record / DOR.",
  },
];

export const DEFAULT_GUIDANCE: PlaybookGuidanceStep[] = [
  {
    title: "Assess severity",
    body: "Check if the condition affects batch quality, safety, or only efficiency. Prioritize safety interlocks first.",
  },
  {
    title: "Stabilize the unit",
    body: "Apply the smallest corrective action that moves the signal back toward setpoint. Avoid aggressive changes during fermentation.",
  },
  {
    title: "Communicate",
    body: "Update shift log and notify downstream units if production rate or quality may be impacted.",
  },
];

export const FINANCIAL_ACTION_ITEMS: PlaybookActionItem[] = [
  {
    id: "review-margin",
    title: "Review margin outlook",
    detail: "Check margin per gallon vs. spot rack and contract coverage before any sell decision.",
  },
  {
    id: "check-surplus",
    title: "Validate surplus position",
    detail: "Confirm unsold gallons after contract fulfillment and days of inventory supply.",
  },
  {
    id: "market-signal",
    title: "Read market sell signal",
    detail: "Hold if signal is 0; evaluate spot sale if signal is 1 and margins support it.",
  },
  {
    id: "hedge",
    title: "Review hedge recommendation",
    detail: "Align with commodity desk on corn basis and rack premium before locking price.",
  },
];

export const FINANCIAL_GUIDANCE: PlaybookGuidanceStep[] = [
  {
    title: "Contract first",
    body: "Never sell surplus that would breach forward contract obligations. Coverage must stay above policy minimum.",
  },
  {
    title: "Margin floor",
    body: "If margin per gallon is below $0.12, hold unless inventory days exceed 18 and market signal is sell.",
  },
  {
    title: "Document decision",
    body: "Log sell/hold rationale in the Financial Margin Review for audit trail.",
  },
];
