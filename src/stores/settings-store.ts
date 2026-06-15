"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IndustryDomain, ReportTemplateConfig, ReportTemplateId } from "@/lib/types";
import { DEFAULT_COMPANY } from "@/lib/auth-constants";
import {
  DEFAULT_COMPANY_FEEDS,
  defaultFeedsForCompany,
  type CompanyFeedConfig,
} from "@/lib/company-features";
import {
  defaultTeamsForCompany,
  migrateTeamsForCompany,
  type OpsTeam,
} from "@/lib/teams";

export const DEFAULT_REPORT_TEMPLATES: ReportTemplateConfig[] = [
  { id: "dor", enabled: true },
];

type SettingsState = {
  companyId: string;
  companyName: string;
  domain: IndustryDomain;
  /** When false, Extras nav (batches, margin, procurement) is hidden */
  operationsSuiteEnabled: boolean;
  companyFeeds: CompanyFeedConfig;
  companyFeedsByCompany: Record<string, CompanyFeedConfig>;
  /** Teams for the active company workspace */
  teams: OpsTeam[];
  /** Per-company team definitions */
  teamsByCompany: Record<string, OpsTeam[]>;
  reportTemplates: ReportTemplateConfig[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  setDomain: (domain: IndustryDomain) => void;
  setCompanyName: (name: string) => void;
  setCompanyId: (id: string) => void;
  setOperationsSuiteEnabled: (enabled: boolean) => void;
  toggleCompanyFeed: (feed: keyof CompanyFeedConfig) => void;
  addTeam: (team: Omit<OpsTeam, "id">) => string;
  updateTeam: (id: string, patch: Partial<Omit<OpsTeam, "id">>) => void;
  deleteTeam: (id: string) => void;
  toggleTeamEnabled: (id: string) => void;
  applyCompany: (id: string, name: string, domain: IndustryDomain) => void;
  toggleReportTemplate: (id: ReportTemplateId) => void;
};

function setTeamsForCompany(
  companyId: string,
  teams: OpsTeam[],
  teamsByCompany: Record<string, OpsTeam[]>,
): Pick<SettingsState, "teams" | "teamsByCompany"> {
  return {
    teams,
    teamsByCompany: { ...teamsByCompany, [companyId]: teams },
  };
}

function setFeedsForCompany(
  companyId: string,
  companyFeeds: CompanyFeedConfig,
  companyFeedsByCompany: Record<string, CompanyFeedConfig>,
): Pick<SettingsState, "companyFeeds" | "companyFeedsByCompany"> {
  return {
    companyFeeds,
    companyFeedsByCompany: { ...companyFeedsByCompany, [companyId]: companyFeeds },
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      companyId: DEFAULT_COMPANY.id,
      companyName: DEFAULT_COMPANY.name,
      domain: "ethanol",
      operationsSuiteEnabled: true,
      companyFeeds: { ...DEFAULT_COMPANY_FEEDS },
      companyFeedsByCompany: {
        [DEFAULT_COMPANY.id]: { ...DEFAULT_COMPANY_FEEDS },
      },
      teams: [],
      teamsByCompany: { [DEFAULT_COMPANY.id]: [] },
      reportTemplates: DEFAULT_REPORT_TEMPLATES.map((t) => ({ ...t })),
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      setDomain: (domain) => set({ domain }),
      setCompanyName: (name) => set({ companyName: name }),
      setCompanyId: (id) => set({ companyId: id }),
      setOperationsSuiteEnabled: (enabled) => {
        set({ operationsSuiteEnabled: enabled });
        if (!enabled) {
          void import("@/stores/commodity-store").then(({ useCommodityStore }) => {
            if (useCommodityStore.getState().connected) {
              useCommodityStore.getState().disconnect();
            }
          });
          void import("@/stores/inventory-store").then(({ useInventoryStore }) => {
            if (useInventoryStore.getState().connected) {
              useInventoryStore.getState().disconnect();
            }
          });
        }
      },
      toggleCompanyFeed: (feed) => {
        const willEnable = !get().companyFeeds[feed];
        set((s) => {
          const next = {
            ...s.companyFeeds,
            [feed]: willEnable,
          };
          return setFeedsForCompany(s.companyId, next, s.companyFeedsByCompany);
        });
        if (!willEnable) {
          void import("@/lib/disconnect-company-feed").then(({ disconnectCompanyFeed }) =>
            disconnectCompanyFeed(feed),
          );
        }
      },
      addTeam: (team) => {
        const id = crypto.randomUUID();
        const s = get();
        const next = [...s.teams, { ...team, id }];
        set(setTeamsForCompany(s.companyId, next, s.teamsByCompany));
        return id;
      },
      updateTeam: (id, patch) =>
        set((s) => {
          const next = s.teams.map((t) => (t.id === id ? { ...t, ...patch } : t));
          return setTeamsForCompany(s.companyId, next, s.teamsByCompany);
        }),
      deleteTeam: (id) =>
        set((s) => {
          const next = s.teams.filter((t) => t.id !== id);
          return setTeamsForCompany(s.companyId, next, s.teamsByCompany);
        }),
      toggleTeamEnabled: (id) =>
        set((s) => {
          const next = s.teams.map((t) =>
            t.id === id ? { ...t, enabled: !t.enabled } : t,
          );
          return setTeamsForCompany(s.companyId, next, s.teamsByCompany);
        }),
      applyCompany: (id, name, domain) => {
        const s = get();
        const teamsByCompany = {
          ...s.teamsByCompany,
          [s.companyId]: s.teams,
        };
        const companyFeedsByCompany = {
          ...s.companyFeedsByCompany,
          [s.companyId]: s.companyFeeds,
        };
        const teams =
          teamsByCompany[id] ?? defaultTeamsForCompany(id);
        const companyFeeds =
          companyFeedsByCompany[id] ?? defaultFeedsForCompany(id);
        set({
          companyId: id,
          companyName: name,
          domain,
          ...setTeamsForCompany(id, teams, teamsByCompany),
          ...setFeedsForCompany(id, companyFeeds, companyFeedsByCompany),
        });
      },
      toggleReportTemplate: (id) =>
        set({
          reportTemplates: get().reportTemplates.map((t) =>
            t.id === id ? { ...t, enabled: !t.enabled } : t,
          ),
        }),
    }),
    {
      name: "signal-relay-settings",
      version: 10,
      skipHydration: true,
      migrate: (persisted: unknown, version: number) => {
        const raw = persisted as Partial<SettingsState> & {
          enabledTeamLenses?: string[];
        };
        const companyId = raw.companyId ?? DEFAULT_COMPANY.id;
        let teamsByCompany = raw.teamsByCompany ?? {};
        let companyFeedsByCompany = raw.companyFeedsByCompany ?? {};

        if (!Object.keys(teamsByCompany).length) {
          const legacy = raw.teams?.length
            ? raw.teams
            : defaultTeamsForCompany(companyId);
          teamsByCompany = { [companyId]: legacy };
        }

        teamsByCompany = Object.fromEntries(
          Object.entries(teamsByCompany).map(([id, teams]) => [
            id,
            migrateTeamsForCompany(teams ?? [], id),
          ]),
        );

        if (!Object.keys(companyFeedsByCompany).length) {
          companyFeedsByCompany = {
            [companyId]: raw.companyFeeds ?? defaultFeedsForCompany(companyId),
          };
        }

        if (!companyFeedsByCompany[DEFAULT_COMPANY.id]) {
          companyFeedsByCompany[DEFAULT_COMPANY.id] = { ...DEFAULT_COMPANY_FEEDS };
        }

        if (version < 10) {
          companyFeedsByCompany = Object.fromEntries(
            Object.entries(companyFeedsByCompany).map(([id, feeds]) => [
              id,
              { ...DEFAULT_COMPANY_FEEDS, ...feeds },
            ]),
          );
        }

        const teams =
          teamsByCompany[companyId] ?? defaultTeamsForCompany(companyId);
        let companyFeeds =
          companyFeedsByCompany[companyId] ?? defaultFeedsForCompany(companyId);

        if (version < 10) {
          companyFeeds = { ...DEFAULT_COMPANY_FEEDS };
        }

        return {
          ...raw,
          operationsSuiteEnabled:
            version < 10 ? true : (raw.operationsSuiteEnabled ?? true),
          companyFeedsByCompany,
          companyFeeds,
          teamsByCompany,
          teams,
          reportTemplates: DEFAULT_REPORT_TEMPLATES.map((t) => ({ ...t })),
        };
      },
      onRehydrateStorage: () => () => {
        useSettingsStore.getState().setHasHydrated(true);
      },
    },
  ),
);
