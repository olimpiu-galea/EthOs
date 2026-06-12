import type { ReportFieldDef, ReportSectionDef } from "./report-templates";
import dorXlsx from "@/data/dor-xlsx-template.json";

type DorXlsxField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "date";
  placeholder?: string;
  required?: boolean;
};

type DorXlsxSection = {
  title: string;
  description?: string;
  fields: DorXlsxField[];
};

const dorSections = (dorXlsx.sections as DorXlsxSection[]).map(
  (section): ReportSectionDef => ({
    title: section.title,
    description: section.description,
    fields: section.fields.map(
      (field): ReportFieldDef => ({
        id: field.id,
        label: field.label,
        type: field.type,
        placeholder: undefined,
        required: field.required,
      }),
    ),
  }),
);

export function getDorTemplateSections(): ReportSectionDef[] {
  return dorSections;
}

/** Default field values from mockAlerts/DOR 01-01-25.xlsx */
export function dorDefaultFieldValues(): Record<string, string> {
  const defaults = dorXlsx.defaults as Record<string, string | number>;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(defaults)) {
    if (value === "" || value == null) continue;
    out[key] = String(value);
  }
  return out;
}

export const DOR_XLSX_SOURCE = dorXlsx.sourceFile;
