import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const HEADER =
  "id,value,name,desc,category,fieldType,frequency,displayLabel,unit";

function slugSection(section) {
  if (section === "Yeast Prop Send") return "YP";
  const m = section.match(/Ferm (\d+) Hours/);
  if (m) return `${m[1]}H`;
  return section.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase();
}

function signalId(section, field) {
  const slug = slugSection(section);
  const fieldSlug = field
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toUpperCase();
  return `FERM-${slug}-${fieldSlug}/_.Value`;
}

function defaultValue(field, section) {
  if (field === "Temp") return 90;
  if (field === "Ethanol") return 5;
  if (field === "Sugars") return 20;
  if (field === "Potential") {
    const e = defaultValue("Ethanol", section);
    const s = defaultValue("Sugars", section);
    return Math.round((e + 0.51 * s) * 100) / 100;
  }
  if (field === "pH") return 4.2;
  if (field === "Brix") return 9;
  return 0;
}

const xlsxPath = path.join(root, "Ferm Data - Field Dictionary.xlsx");
const wb = XLSX.readFile(xlsxPath);
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Section Layout"], {
  header: 1,
  defval: "",
});

const rowsOut = [HEADER];
const seen = new Set();

for (const row of rows.slice(1)) {
  const section = String(row[0] || "").trim();
  const field = String(row[1] || "").trim();
  if (!section || !field || field === "Date") continue;
  if (section === "Batch Info" || section === "Batch Data") continue;

  const id = signalId(section, field);
  if (seen.has(id)) continue;
  seen.add(id);

  const displayLabel =
    section === "Yeast Prop Send"
      ? `YP ${field}`
      : `${section.replace("Ferm ", "Ferm ")} ${field}`;

  const value = defaultValue(field, section);
  rowsOut.push(
    [
      id,
      value,
      id,
      row[2] || `${displayLabel} from ferm data`,
      "FermData",
      "analog",
      "batch",
      displayLabel,
      field === "Temp" ? "°F" : field === "Sugars" || field === "Ethanol" ? "%" : "",
    ].join(","),
  );
}

// Derived potential per fermentation hour (Ethanol + 0.51 × Sugars)
for (const hour of [6, 12, 18, 24, 30, 40, 50, 55]) {
  const section = `Ferm ${hour} Hours`;
  const id = signalId(section, "Potential");
  if (seen.has(id)) continue;
  seen.add(id);
  const e = defaultValue("Ethanol", section);
  const s = defaultValue("Sugars", section);
  const value = Math.round((e + 0.51 * s) * 100) / 100;
  rowsOut.push(
    [
      id,
      value,
      id,
      `Computed potential at ${hour}h`,
      "FermData",
      "analog",
      "batch",
      `Ferm ${hour} Hours Potential`,
      "",
    ].join(","),
  );
}

const ypPotentialId = signalId("Yeast Prop Send", "Potential");
if (!seen.has(ypPotentialId)) {
  const e = defaultValue("Ethanol", "Yeast Prop Send");
  const s = defaultValue("Sugars", "Yeast Prop Send");
  rowsOut.push(
    [
      ypPotentialId,
      Math.round((e + 0.51 * s) * 100) / 100,
      ypPotentialId,
      "Computed potential at yeast prop send",
      "FermData",
      "analog",
      "batch",
      "YP Potential",
      "",
    ].join(","),
  );
}

const outPath = path.join(root, "public", "fixtures", "ferm-data-sheet.csv");
fs.writeFileSync(outPath, rowsOut.join("\n") + "\n");
console.log(`Wrote ${rowsOut.length - 1} ferm signals to ${outPath}`);
