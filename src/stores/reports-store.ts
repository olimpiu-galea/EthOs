"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CommoditySignalSnapshot,
  LinkedAlertSnapshot,
  ReportDocument,
  ReportTemplateId,
  UserRole,
} from "@/lib/types";
import { defaultReportTitle } from "@/lib/report-templates";
import { normalizeReportDocument } from "@/lib/report-document";

type CreateReportInput = {
  templateId: ReportTemplateId;
  title: string;
  createdBy: string;
  author?: string;
  authorRole?: UserRole;
  fields: Record<string, string>;
  linkedAlerts?: LinkedAlertSnapshot[];
  commoditySnapshot?: CommoditySignalSnapshot[];
};

type ReportsState = {
  documents: ReportDocument[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  createDocument: (input: CreateReportInput) => string;
  deleteDocument: (id: string) => void;
};

function migrateDocuments(raw: ReportDocument[]): ReportDocument[] {
  return raw.map((d) => normalizeReportDocument(d));
}

export const useReportsStore = create<ReportsState>()(
  persist(
    (set) => ({
      documents: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      createDocument: ({
        templateId,
        title,
        createdBy,
        author,
        authorRole,
        fields,
        linkedAlerts = [],
        commoditySnapshot = [],
      }) => {
        const id = crypto.randomUUID();
        const doc: ReportDocument = {
          id,
          templateId,
          title: title.trim() || defaultReportTitle(templateId),
          createdAt: Date.now(),
          createdBy,
          author: (author ?? createdBy).trim() || createdBy,
          authorRole,
          fields: {
            ...fields,
            author: fields.author?.trim() || author?.trim() || createdBy,
          },
          linkedAlerts,
          commoditySnapshot:
            commoditySnapshot.length > 0 ? commoditySnapshot : undefined,
        };
        set((s) => ({ documents: [doc, ...s.documents] }));
        return id;
      },

      deleteDocument: (id) =>
        set((s) => ({
          documents: s.documents.filter((d) => d.id !== id),
        })),
    }),
    {
      name: "signal-relay-reports",
      version: 3,
      skipHydration: true,
      partialize: (s) => ({ documents: s.documents }),
      migrate: (persisted: unknown) => {
        const raw = persisted as { documents?: ReportDocument[] };
        return {
          documents: migrateDocuments(raw.documents ?? []),
        };
      },
      onRehydrateStorage: () => () => {
        useReportsStore.getState().setHasHydrated(true);
      },
    },
  ),
);
