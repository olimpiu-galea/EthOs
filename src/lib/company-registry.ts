import {
  DEFAULT_COMPANY,
  DEMO_ACCOUNTS,
  HEALTHCARE_COMPANY,
  ROLE_LABELS,
} from "@/lib/auth-constants";
import type { AuthUser, Company, IndustryDomain } from "@/lib/types";

export const BUILTIN_COMPANIES: Company[] = [
  {
    id: DEFAULT_COMPANY.id,
    name: DEFAULT_COMPANY.name,
    domain: "ethanol",
    createdAt: 0,
  },
  {
    id: HEALTHCARE_COMPANY.id,
    name: HEALTHCARE_COMPANY.name,
    domain: "healthcare",
    createdAt: 0,
  },
];

export function seedCompanies(stored: Company[]): Company[] {
  const map = new Map(stored.map((c) => [c.id, c]));
  for (const builtin of BUILTIN_COMPANIES) {
    if (!map.has(builtin.id)) {
      map.set(builtin.id, { ...builtin });
    }
  }
  return sortCompanies(Array.from(map.values()));
}

export function sortCompanies(companies: Company[]): Company[] {
  return [...companies].sort((a, b) => {
    if (a.createdAt === 0 && b.createdAt !== 0) return -1;
    if (b.createdAt === 0 && a.createdAt !== 0) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function listUsersForCompany(
  companyId: string,
  registeredUsers: AuthUser[],
): AuthUser[] {
  const demoUsers: AuthUser[] = DEMO_ACCOUNTS.filter(
    (a) => a.companyId === companyId,
  ).map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    companyId: a.companyId,
    createdAt: 0,
  }));

  const registered = registeredUsers.filter((u) => u.companyId === companyId);
  const seen = new Set(demoUsers.map((u) => u.email.toLowerCase()));
  const merged = [
    ...demoUsers,
    ...registered.filter((u) => !seen.has(u.email.toLowerCase())),
  ];

  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

/** Users eligible for ops team membership (same company, not platform staff) */
export function listTeamAssignableUsers(
  companyId: string,
  registeredUsers: AuthUser[],
): AuthUser[] {
  return listUsersForCompany(companyId, registeredUsers).filter(
    (u) => u.companyId === companyId && u.role !== "platform_admin",
  );
}

export function domainLabel(domain: IndustryDomain): string {
  const labels: Record<IndustryDomain, string> = {
    ethanol: "Ethanol",
    healthcare: "Healthcare",
    steel: "Steel",
    food_beverage: "Food & Beverage",
    water: "Water Treatment",
    pharma: "Pharma",
  };
  return labels[domain];
}

export function roleLabel(role: AuthUser["role"]): string {
  return ROLE_LABELS[role];
}
