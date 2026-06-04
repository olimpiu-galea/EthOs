/**
 * Generates minute-by-minute DCS history for demo (today + yesterday).
 * Live CSV (9 columns) stays the snapshot; timeline JSON holds history.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "public", "fixtures", "dcs-tags.csv");
const outPath = path.join(root, "public", "fixtures", "dcs-tags-timeline.json");

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseValue(raw) {
  const t = raw.trim();
  if (t === "true") return 1;
  if (t === "false") return 0;
  const n = Number(t);
  return Number.isNaN(n) ? 0 : n;
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const c = parseCsvLine(lines[i]);
    if (c.length !== 9) continue;
    rows.push({
      id: c[0],
      base: parseValue(c[1]),
      name: c[2],
      desc: c[3],
      category: c[4],
      fieldType: c[5],
      frequency: c[6],
      displayLabel: c[7],
      unit: c[8],
    });
  }
  return rows;
}

function tagKey(row) {
  return `${row.id}::${row.displayLabel}`;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function generateDay(rows, dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const valuesByKey = {};
  for (const row of rows) {
    valuesByKey[tagKey(row)] = [];
  }

  const minutes = 24 * 60;
  for (let i = 0; i < minutes; i++) {
    const hour = Math.floor(i / 60);
    const min = i % 60;
    for (const row of rows) {
      const base = row.base;
      const isDigital = row.fieldType === "digital" || base === 0 || base === 1;
      let v = base;

      if (!isDigital) {
        const dailyWave = Math.sin((i / minutes) * Math.PI * 2) * (base * 0.06);
        const spike =
          row.id.includes("TE-3301") && hour >= 10 && hour <= 14
            ? 8 + (min % 10) * 0.5
            : row.id.includes("TE-1100") && hour >= 15 && hour <= 18
              ? 6
              : row.id.includes("PT-1102") && hour === 9 && min >= 20 && min <= 35
                ? -0.8
                : 0;
        const noise = (Math.sin(i * 0.17 + row.id.length) * 0.5) * (base * 0.02);
        v = base + dailyWave + spike + noise;
        v = Math.round(v * 100) / 100;
      } else if (row.id.includes("AE-2203") && hour === 11 && min === 30) {
        v = 1;
      } else if (hour === 8 && min === 0 && row.id.includes("AG-3305")) {
        v = 1;
      }

      valuesByKey[tagKey(row)].push(v);
    }
  }

  return {
    date: dateStr,
    minutes,
    valuesByKey,
  };
}

const csv = fs.readFileSync(csvPath, "utf8");
const rows = parseCsv(csv);
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const timeline = {
  intervalMinutes: 1,
  tags: rows.map((r) => ({
    id: r.id,
    name: r.name,
    desc: r.desc,
    category: r.category,
    fieldType: r.fieldType,
    frequency: r.frequency,
    displayLabel: r.displayLabel,
    unit: r.unit,
  })),
  days: {
    [formatDate(yesterday)]: generateDay(rows, formatDate(yesterday)),
    [formatDate(today)]: generateDay(rows, formatDate(today)),
  },
};

fs.writeFileSync(outPath, JSON.stringify(timeline));
console.log(`Wrote ${outPath}`);
console.log(`Days: ${Object.keys(timeline.days).join(", ")}`);
console.log(`Tags: ${rows.length}, minutes/day: 1440`);
