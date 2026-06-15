import type { IndustryDomain, UserRole } from "./types";

export const DEFAULT_COMPANY = {
  id: "lakeview",
  name: "Lakeview Ethanol",
  slug: "lakeview",
} as const;

export const HEALTHCARE_COMPANY = {
  id: "medcompany",
  name: "medcompany",
  slug: "medcompany",
} as const;

export type DemoAccount = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  companyId: string;
  title: string;
};

export const DEMO_PASSWORD = "Password1!";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "company-admin",
    email: "admin@lakeview.com",
    password: DEMO_PASSWORD,
    name: "Emily Crawford",
    role: "company_admin",
    companyId: "lakeview",
    title: "Company Admin · Lakeview",
  },
  {
    id: "supervisor",
    email: "supervisor@lakeview.com",
    password: DEMO_PASSWORD,
    name: "Brian Henderson",
    role: "supervisor",
    companyId: "lakeview",
    title: "Supervisor",
  },
  {
    id: "operational",
    email: "operations@lakeview.com",
    password: DEMO_PASSWORD,
    name: "James Reed",
    role: "operational",
    companyId: "lakeview",
    title: "Operations Specialist",
  },
  {
    id: "healthcare-supervisor",
    email: "supervisor@medcompany.com",
    password: DEMO_PASSWORD,
    name: "Dr. Karen Walsh",
    role: "supervisor",
    companyId: "medcompany",
    title: "Supervisor · medcompany",
  },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  platform_admin: "Platform Admin",
  company_admin: "Company Admin",
  supervisor: "Supervisor",
  financial: "Financial",
  operational: "Operational",
  maintenance: "Maintenance",
  qa_lab: "QA / Lab",
  procurement: "Procurement",
};

export function canManageSettings(role: UserRole): boolean {
  return role === "platform_admin" || role === "company_admin";
}

export function isPlatformAdmin(role: UserRole): boolean {
  return role === "platform_admin";
}

export function isCompanyAdmin(role: UserRole): boolean {
  return role === "company_admin";
}

export function canManageIntegrations(role: UserRole): boolean {
  return (
    role === "supervisor" ||
    role === "company_admin" ||
    role === "platform_admin"
  );
}

export function canCreatePlaybooks(role: UserRole): boolean {
  return (
    role === "platform_admin" ||
    role === "company_admin" ||
    role === "supervisor" ||
    role === "operational"
  );
}

export function canSeeAllAgendaTeams(role: UserRole): boolean {
  return (
    role === "platform_admin" ||
    role === "company_admin" ||
    role === "supervisor"
  );
}

/** @deprecated use canSeeAllAgendaTeams */
export const canSeeAllAgendaCategories = canSeeAllAgendaTeams;

export const INDUSTRY_DOMAINS: {
  id: IndustryDomain;
  label: string;
  description: string;
  ready: boolean;
}[] = [
  {
    id: "ethanol",
    label: "Ethanol",
    description: "Fermentation, distillation & commodity margins",
    ready: true,
  },
  {
    id: "healthcare",
    label: "Healthcare",
    description: "Patient flow, equipment & compliance",
    ready: false,
  },
  {
    id: "steel",
    label: "Steel",
    description: "Furnace, casting & quality",
    ready: false,
  },
  {
    id: "food_beverage",
    label: "Food & Beverage",
    description: "Production line, cold chain & QA",
    ready: false,
  },
  {
    id: "water",
    label: "Water Treatment",
    description: "Intake, treatment & distribution",
    ready: false,
  },
  {
    id: "pharma",
    label: "Pharma",
    description: "Batch records, clean room & validation",
    ready: false,
  },
];
