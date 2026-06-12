import type { ReportFieldDef, ReportSectionDef } from "./report-templates";

export type DorTab = {
  id: string;
  label: string;
  sectionTitles: string[];
};

export const DOR_TABS: DorTab[] = [
  {
    id: "header",
    label: "Header",
    sectionTitles: ["Report header"],
  },
  {
    id: "production",
    label: "Production",
    sectionTitles: [
      "CORN (BSHLS)",
      "DENATURANT (GLS)",
      "ETHANOL",
      "CORN OIL (LBS)",
      "SYRUP (TONS)",
      "DDGS (TONS)",
      "Natural gas & energy",
    ],
  },
  {
    id: "workbook",
    label: "Workbook",
    sectionTitles: [
      "Operations Detail",
      "Corn and Ethanol Recap",
      "Tank Farm Inventory",
      "Rail Cars",
      "Corn Inventory",
      "Corn Rolling Balance",
      "Corn Contract Balance",
      "Merrill Truck",
      "LeMars Loadout",
      "Boiler Gas Flow",
      "D3 RIN TRACKING",
      "Yield Report",
    ],
  },
  {
    id: "alerts",
    label: "Alerts",
    sectionTitles: ["Open items & alerts"],
  },
];

export type DorMetricCell = {
  fieldId: string;
  period: string;
  metric: string;
};

export type DorMetricRow = {
  line: string;
  cells: Record<string, DorMetricCell>;
};

export type DorYieldRow = {
  label: string;
  dailyId?: string;
  mtdId?: string;
  ytdId?: string;
};

export type DorMetricLayout = {
  kind: "metrics";
  columns: { key: string; period: string; metric: string; label: string }[];
  rows: DorMetricRow[];
  yields: DorYieldRow[];
  loose: ReportFieldDef[];
};

const METRIC_LABEL =
  /^(.+?) — (DAILY|MTD|YTD) (.+)$/i;
const YIELD_LABEL = /^(.+?) — (DAILY|MTD|YTD)$/i;

function columnKey(period: string, metric: string) {
  return `${period.toUpperCase()}|${metric}`;
}

export function isWorkbookTextSection(section: ReportSectionDef): boolean {
  return (
    section.fields.length === 1 &&
    section.fields[0].type === "textarea" &&
    section.fields[0].id.startsWith("sheet_")
  );
}

export function layoutDorMetricSection(
  fields: ReportFieldDef[],
): DorMetricLayout {
  const columns: DorMetricLayout["columns"] = [];
  const columnIndex = new Map<string, number>();
  const rowMap = new Map<string, DorMetricRow>();
  const yields = new Map<string, DorYieldRow>();
  const loose: ReportFieldDef[] = [];

  for (const field of fields) {
    const metricMatch = field.label.match(METRIC_LABEL);
    if (metricMatch) {
      const line = metricMatch[1].trim();
      const period = metricMatch[2].toUpperCase();
      const metric = metricMatch[3].trim();
      const key = columnKey(period, metric);
      if (!columnIndex.has(key)) {
        columnIndex.set(key, columns.length);
        columns.push({
          key,
          period,
          metric,
          label: `${period} ${metric}`,
        });
      }
      if (!rowMap.has(line)) {
        rowMap.set(line, { line, cells: {} });
      }
      rowMap.get(line)!.cells[key] = { fieldId: field.id, period, metric };
      continue;
    }

    const yieldMatch = field.label.match(YIELD_LABEL);
    if (yieldMatch) {
      const label = yieldMatch[1].trim();
      const period = yieldMatch[2].toLowerCase() as "daily" | "mtd" | "ytd";
      const row = yields.get(label) ?? { label };
      if (period === "daily") row.dailyId = field.id;
      if (period === "mtd") row.mtdId = field.id;
      if (period === "ytd") row.ytdId = field.id;
      yields.set(label, row);
      continue;
    }

    loose.push(field);
  }

  const periodOrder = ["DAILY", "MTD", "YTD"];
  columns.sort((a, b) => {
    const pd = periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period);
    if (pd !== 0) return pd;
    return a.metric.localeCompare(b.metric);
  });

  return {
    kind: "metrics",
    columns,
    rows: [...rowMap.values()],
    yields: [...yields.values()],
    loose,
  };
}

export function dorSectionsForTab(
  sections: ReportSectionDef[],
  tabId: string,
): ReportSectionDef[] {
  const tab = DOR_TABS.find((t) => t.id === tabId);
  if (!tab) return [];
  const titles = new Set(tab.sectionTitles);
  return sections.filter((s) => titles.has(s.title));
}
