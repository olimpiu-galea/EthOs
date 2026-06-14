"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, Company, IndustryDomain, UserRole } from "@/lib/types";
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  DEFAULT_COMPANY,
  HEALTHCARE_COMPANY,
} from "@/lib/auth-constants";
import { autoConnectIntegrationsForRole } from "@/lib/auto-connect-integrations";
import {
  clearOnboardingRequiredAfterReset,
  isOnboardingRequiredAfterReset,
} from "@/lib/reset-lakeview-workspace";
import {
  BUILTIN_COMPANIES,
  seedCompanies,
  sortCompanies,
} from "@/lib/company-registry";

type AuthState = {
  user: AuthUser | null;
  users: AuthUser[];
  companies: Company[];
  onboardingComplete: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (email: string, password: string) => boolean;
  loginAsDemo: (accountId: string) => boolean;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    domain: IndustryDomain;
  }) => boolean;
  logout: () => void;
  completeOnboarding: () => void;
  addCompany: (data: { name: string; domain: IndustryDomain }) => string;
  updateCompany: (
    id: string,
    patch: Partial<Pick<Company, "name" | "domain">>,
  ) => void;
  deleteCompany: (id: string) => void;
};

function demoToUser(
  accountId: string,
  password: string,
): AuthUser | null {
  const demo = DEMO_ACCOUNTS.find((a) => a.id === accountId);
  if (!demo || demo.password !== password) return null;
  return {
    id: demo.id,
    email: demo.email,
    name: demo.name,
    role: demo.role,
    companyId: demo.companyId,
    createdAt: Date.now(),
  };
}

function newCompanyId(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `${slug || "company"}-${crypto.randomUUID().slice(0, 8)}`;
}

function syncSettingsForCompany(companyId: string, companies: Company[]) {
  void import("@/stores/settings-store").then(({ useSettingsStore }) => {
    if (companyId === DEFAULT_COMPANY.id) {
      useSettingsStore.getState().applyCompany(
        DEFAULT_COMPANY.id,
        DEFAULT_COMPANY.name,
        "ethanol",
      );
      return;
    }
    if (companyId === HEALTHCARE_COMPANY.id) {
      useSettingsStore.getState().applyCompany(
        HEALTHCARE_COMPANY.id,
        HEALTHCARE_COMPANY.name,
        "healthcare",
      );
      return;
    }
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      useSettingsStore
        .getState()
        .applyCompany(company.id, company.name, company.domain);
    }
  });
}

function onboardingCompleteForSession(): boolean {
  return !isOnboardingRequiredAfterReset();
}

function afterLogin(role: UserRole) {
  void (async () => {
    await autoConnectIntegrationsForRole(role);
  })();
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: [],
      companies: [...BUILTIN_COMPANIES],
      onboardingComplete: false,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: (email, password) => {
        const demo = DEMO_ACCOUNTS.find(
          (a) => a.email.toLowerCase() === email.toLowerCase(),
        );
        if (demo && demo.password === password) {
          const user = {
            id: demo.id,
            email: demo.email,
            name: demo.name,
            role: demo.role,
            companyId: demo.companyId,
            createdAt: Date.now(),
          };
          set({ user, onboardingComplete: onboardingCompleteForSession() });
          syncSettingsForCompany(demo.companyId, get().companies);
          afterLogin(user.role);
          return true;
        }
        const registered = get().users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );
        if (!registered) return false;
        const stored = localStorage.getItem(
          `signal-relay-pw-${registered.id}`,
        );
        if (stored !== password) return false;
        set({
          user: registered,
          onboardingComplete: onboardingCompleteForSession(),
        });
        syncSettingsForCompany(registered.companyId, get().companies);
        afterLogin(registered.role);
        return true;
      },

      loginAsDemo: (accountId) => {
        const user = demoToUser(accountId, DEMO_PASSWORD);
        if (!user) return false;
        set({ user, onboardingComplete: onboardingCompleteForSession() });
        syncSettingsForCompany(user.companyId, get().companies);
        afterLogin(user.role);
        return true;
      },

      signup: ({ name, email, password, companyName, domain }) => {
        const exists =
          DEMO_ACCOUNTS.some(
            (a) => a.email.toLowerCase() === email.toLowerCase(),
          ) ||
          get().users.some(
            (u) => u.email.toLowerCase() === email.toLowerCase(),
          );
        if (exists) return false;

        const trimmedCompany = companyName.trim();
        if (!trimmedCompany) return false;

        const company: Company = {
          id: newCompanyId(trimmedCompany),
          name: trimmedCompany,
          domain,
          createdAt: Date.now(),
        };

        const user: AuthUser = {
          id: crypto.randomUUID(),
          email,
          name,
          role: "company_admin",
          companyId: company.id,
          createdAt: Date.now(),
        };

        localStorage.setItem(`signal-relay-pw-${user.id}`, password);
        set({
          users: [...get().users, user],
          companies: [...get().companies, company],
          user,
          onboardingComplete: false,
        });
        syncSettingsForCompany(company.id, [...get().companies, company]);
        return true;
      },

      logout: () => set({ user: null }),
      completeOnboarding: () => {
        clearOnboardingRequiredAfterReset();
        set({ onboardingComplete: true });
      },

      addCompany: ({ name, domain }) => {
        const trimmed = name.trim();
        const company: Company = {
          id: newCompanyId(trimmed),
          name: trimmed,
          domain,
          createdAt: Date.now(),
        };
        set({
          companies: sortCompanies([...get().companies, company]),
        });
        return company.id;
      },

      updateCompany: (id, patch) => {
        const current = get().companies;
        const existing =
          current.find((c) => c.id === id) ??
          BUILTIN_COMPANIES.find((c) => c.id === id);
        if (!existing) return;

        const updated: Company = { ...existing, ...patch, id };
        const next = current.some((c) => c.id === id)
          ? current.map((c) => (c.id === id ? updated : c))
          : [...current, updated];

        set({ companies: sortCompanies(next) });

        if (get().user?.companyId === id) {
          syncSettingsForCompany(id, next);
        }
      },

      deleteCompany: (id) => {
        const nextCompanies = get().companies.filter((c) => c.id !== id);
        set({
          companies: nextCompanies,
          users: get().users.filter((u) => u.companyId !== id),
        });

        if (get().user?.companyId === id) {
          syncSettingsForCompany(DEFAULT_COMPANY.id, nextCompanies);
        }
      },
    }),
    {
      name: "signal-relay-auth",
      skipHydration: true,
      partialize: (s) => ({
        user: s.user,
        users: s.users,
        companies: s.companies,
        onboardingComplete: s.onboardingComplete,
      }),
      onRehydrateStorage: () => (state) => {
        useAuthStore.setState({
          companies: seedCompanies(state?.companies ?? []),
        });
        useAuthStore.getState().setHasHydrated(true);
      },
    },
  ),
);
