import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const HOUR_COLS = {
  6: { p: 3, t: 4, s: 5, e: 6 },
  12: { p: 7, t: 8, s: 9, e: 10 },
  18: { p: 11, t: 12, s: 13, e: 14 },
  24: { p: 15, t: 16, s: 17, e: 18 },
  30: { p: 19, t: 20, s: 21, e: 22 },
  40: { p: 23, t: 24, s: 25, e: 26 },
  50: { p: 27, t: 28, s: 29, e: 30 },
  55: { p: 31, t: 32, s: 33, e: 34 },
};

function excelToMs(n) {
  if (typeof n !== "number" || !n) return null;
  return Math.round((n - 25569) * 86400000);
}

function parseHour(ind) {
  const m = String(ind).match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const xlsxPath = path.join(
  root,
  "mockAlerts",
  "All Batches -  Potential vs Temp 2026.xlsx",
);
const wb = XLSX.readFile(xlsxPath);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
  header: 1,
  defval: "",
});
const alerts = [];

for (let i = 2; i < rows.length; i++) {
  const r = rows[i];
  const indicator = r[36];
  const reason = r[37];
  if (!indicator && !reason) continue;
  const hour = parseHour(indicator);
  const startMs = excelToMs(r[2]);
  if (!hour || !startMs) continue;
  const cols = HOUR_COLS[hour];
  const potential = cols ? num(r[cols.p]) : null;
  const temp = cols ? num(r[cols.t]) : null;
  const sugars = cols ? num(r[cols.s]) : null;
  const ethanol = cols ? num(r[cols.e]) : null;
  const batchId = String(r[0]);
  const rawTriggeredAt = startMs + hour * 3600000;
  const src = new Date(rawTriggeredAt);
  const triggeredAt = new Date(
    2026,
    src.getMonth(),
    src.getDate(),
    src.getHours(),
    src.getMinutes(),
    src.getSeconds(),
    src.getMilliseconds(),
  ).getTime();

  alerts.push({
    mockAlertKey: `pvt-${batchId}-${hour}`,
    batchId,
    fermenter: String(r[1] || ""),
    startFillAt: startMs,
    checkpointHour: hour,
    triggeredAt,
    potential,
    temp,
    sugars,
    ethanol,
    ethanolAtDrop: num(r[35]),
    earlyIndicator: String(indicator || ""),
    reason: String(reason || "").trim(),
    conditionsSummary:
      String(reason || "").split("\n").slice(-1)[0] || String(indicator),
  });
}

const outDir = path.join(root, "src", "data");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "potential-vs-temp-mock-alerts.json"),
  JSON.stringify(alerts, null, 2),
);
console.log(`Wrote ${alerts.length} mock alerts`);
