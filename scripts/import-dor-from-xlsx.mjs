import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const xlsxPath = path.join(root, "mockAlerts", "DOR 01-01-25.xlsx");

function slug(parts) {
  return parts
    .filter(Boolean)
    .join("_")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 56);
}

function excelDate(v) {
  if (typeof v !== "number" || v < 30000 || v > 60000) return null;
  const d = XLSX.SSF.parse_date_code(v);
  if (!d) return null;
  return `${d.m}/${d.d}/${d.y}`;
}

function fmt(v) {
  if (v === "" || v == null) return "";
  if (typeof v === "number") {
    return String(
      Math.abs(v) >= 1000
        ? Math.round(v * 100) / 100
        : Math.round(v * 10000) / 10000,
    );
  }
  return String(v).trim();
}

function parseOperationsReport(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const defaults = {};
  const sections = [];

  defaults.reportDate = excelDate(rows[3]?.[0]) ?? fmt(rows[3]?.[0]);
  defaults.asOfLabel = String(rows[2]?.[0] ?? "As of 6AM").trim();
  defaults.reportTitle = String(rows[1]?.[0] ?? "Daily Operations Report").trim();
  defaults.facilityName = String(rows[0]?.[0] ?? "").trim();

  let metricRow = null;
  let currentSection = null;

  const periodCols = {
    daily: [
      { key: "metric1", col: 2 },
      { key: "metric2", col: 3 },
      { key: "availInv", col: 4 },
    ],
    mtd: [
      { key: "metric1", col: 6 },
      { key: "metric2", col: 7 },
    ],
    ytd: [
      { key: "metric1", col: 9 },
      { key: "metric2", col: 10 },
    ],
  };

  function metricLabels() {
    const m1 = String(metricRow?.[2] ?? "Receipts").trim() || "Receipts";
    const m2 = String(metricRow?.[3] ?? "Grind").trim() || "Grind";
    const inv = String(metricRow?.[4] ?? "Avail Inv").trim() || "Avail Inv";
    return { m1, m2, inv };
  }

  function addField(id, label, value, type = "text") {
    defaults[id] = value;
    if (!currentSection) return;
    currentSection.fields.push({ id, label, type, placeholder: value || undefined });
  }

  function addRowValues(lineLabel, row) {
    const labels = metricLabels();
    const base = slug([lineLabel, currentSection?.title]);

    for (const [period, cols] of Object.entries(periodCols)) {
      for (const { key, col } of cols) {
        const metricName =
          key === "availInv"
            ? labels.inv
            : key === "metric1"
              ? labels.m1
              : labels.m2;
        const id = slug([base, period, metricName]);
        const label = `${lineLabel} — ${period.toUpperCase()} ${metricName}`;
        addField(id, label, fmt(row[col]));
      }
    }
  }

  function addYield(label, row) {
    const base = slug([label, currentSection?.title]);
    addField(slug([base, "daily"]), `${label} · Daily`, fmt(row[3]));
    addField(slug([base, "mtd"]), `${label} · MTD`, fmt(row[7]));
    addField(slug([base, "ytd"]), `${label} · YTD`, fmt(row[10]));
  }

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const c0 = String(r[0] ?? "").trim();
    const c1 = String(r[1] ?? "").trim();

    if (
      ["Receipts", "Shipments"].includes(String(r[2] ?? "").trim()) &&
      String(r[6] ?? "").includes("Month")
    ) {
      metricRow = r;
      continue;
    }

    if (
      c0 &&
      /^[A-Z][A-Z0-9 /().-]+$/.test(c0) &&
      !["Total", "Dry", "Wet", "Total Gallons", "Total Dry", "Total Wet"].includes(c0)
    ) {
      if (currentSection?.fields?.length) sections.push(currentSection);
      const prev = rows[i - 1];
      if (prev && ["Receipts", "Shipments"].includes(String(prev[2] ?? "").trim())) {
        metricRow = prev;
      }
      currentSection = {
        title: c0,
        description: "From DOR Operations Report",
        fields: [],
      };
      continue;
    }

    if (!currentSection) continue;

    if (c0.includes("Yield")) {
      addYield(c0, r);
      continue;
    }

    if (["Total", "Total Gallons", "Total Dry", "Total Wet"].includes(c0)) {
      addRowValues(c0, r);
      continue;
    }

    if (["Dry", "Wet"].includes(c0) && c1) {
      addRowValues(`${c0} ${c1}`, r);
      continue;
    }

    if (!c0 && c1) {
      addRowValues(c1, r);
    }
  }

  if (currentSection?.fields?.length) sections.push(currentSection);

  sections.unshift({
    title: "Report header",
    description: "Daily Operations Report cover fields",
    fields: [
      { id: "facilityName", label: "Facility", type: "text" },
      { id: "reportTitle", label: "Report title", type: "text" },
      { id: "asOfLabel", label: "As-of label", type: "text" },
      { id: "reportDate", label: "Report date", type: "text" },
    ],
  });

  // Natural gas / energy block
  const energySection = {
    title: "Natural gas & energy",
    description: "BTU intensity from DOR Operations Report",
    fields: [],
  };
  for (let i = 56; i <= 61; i++) {
    const r = rows[i];
    const label = [r[2], r[8], r[22]].filter((x) => String(x ?? "").trim()).join(" · ");
    if (!label) continue;
    const id = slug(["energy", label]);
    const val = [r[3], r[4], r[9], r[10], r[23], r[24]]
      .map(fmt)
      .filter(Boolean)
      .join(" / ");
    if (val) {
      defaults[id] = val;
      energySection.fields.push({
        id,
        label,
        type: "text",
        placeholder: val,
      });
    }
  }
  if (energySection.fields.length) sections.push(energySection);

  return { defaults, sections };
}

function sheetAsTextarea(sheet, title, maxRows = 40) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const lines = rows
    .slice(0, maxRows)
    .map((r) => r.map(fmt).filter(Boolean).join("\t"))
    .filter((l) => l.length > 0);
  const id = slug(["sheet", title]);
  return {
    section: {
      title,
      description: `Imported from DOR workbook — ${title}`,
      fields: [
        {
          id,
          label: title,
          type: "textarea",
          placeholder: lines.slice(0, 3).join("\n"),
        },
      ],
    },
    defaultValue: lines.join("\n"),
    fieldId: id,
  };
}

const wb = XLSX.readFile(xlsxPath);
const main = parseOperationsReport(wb.Sheets["Operations Report"]);

const extraSheets = [
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
];

for (const name of extraSheets) {
  const sheet = wb.Sheets[name];
  if (!sheet) continue;
  const block = sheetAsTextarea(sheet, name, name === "Operations Detail" ? 15 : 25);
  main.sections.push(block.section);
  main.defaults[block.fieldId] = block.defaultValue;
}

main.sections.push({
  title: "Open items & alerts",
  description: "Playbook alerts and follow-ups (app-specific)",
  fields: [
    {
      id: "openAlerts",
      label: "Open alerts / actions",
      type: "textarea",
      placeholder: "Outstanding playbook actions, follow-ups…",
    },
    {
      id: "batchStatus",
      label: "Batch status",
      type: "textarea",
      placeholder: "Fermenters, cook status, lab holds…",
    },
    {
      id: "shiftNotes",
      label: "Shift notes",
      type: "textarea",
      placeholder: "Key events, staffing, abnormal situations…",
    },
  ],
});

const out = {
  sourceFile: "mockAlerts/DOR 01-01-25.xlsx",
  generatedAt: new Date().toISOString(),
  sections: main.sections,
  defaults: main.defaults,
};

const outPath = path.join(root, "src", "data", "dor-xlsx-template.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(
  `Wrote ${outPath} — ${out.sections.length} sections, ${Object.keys(out.defaults).length} default values`,
);
