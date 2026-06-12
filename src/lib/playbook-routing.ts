import { playbookConditionsFlat } from "@/lib/playbook-utils";
import type { Playbook, UserRole } from "./types";

const ROUTING_RULES: { pattern: RegExp; roles: UserRole[] }[] = [
  { pattern: /contam|infection|ph|brix|lab|quality/i, roles: ["qa_lab", "operational", "supervisor"] },
  { pattern: /pressure|steam|sieve|valve|maintenance|agitator|cooling/i, roles: ["maintenance", "operational", "supervisor"] },
  { pattern: /margin|commodity|corn|inventory|grain|procurement|sell/i, roles: ["procurement", "financial", "supervisor"] },
  { pattern: /ferm|temp|batch|reactor/i, roles: ["operational", "supervisor"] },
];

export function inferRoutedRoles(
  playbook: Pick<Playbook, "name" | "description" | "conditions" | "conditionGroups">,
): UserRole[] {
  const text = [
    playbook.name,
    playbook.description ?? "",
    ...playbookConditionsFlat(playbook).map(
      (c) => `${c.rule.displayLabel ?? ""} ${c.rule.signalId}`,
    ),
  ].join(" ");

  for (const rule of ROUTING_RULES) {
    if (rule.pattern.test(text)) return rule.roles;
  }

  return ["operational", "supervisor"];
}

export function roleSeesAlert(
  role: UserRole,
  routedRoles: UserRole[] | undefined,
): boolean {
  if (
    role === "platform_admin" ||
    role === "company_admin" ||
    role === "supervisor"
  ) {
    return true;
  }
  if (!routedRoles?.length) return true;
  return routedRoles.includes(role);
}
