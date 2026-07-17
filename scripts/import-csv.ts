/**
 * Import a fragrance dataset CSV into the local database.
 *
 * Usage:
 *   npm run db:import -- path/to/dataset.csv
 *
 * Expected columns (case-insensitive; extra columns are ignored):
 *   brand, name (or perfume), gender, top (or top_notes), middle (or
 *   middle_notes/heart), base (or base_notes), accords (or main_accords)
 *
 * Note lists inside a column may be separated by commas or semicolons.
 * This matches the shape of the public Kaggle/Fragrantica-derived datasets —
 * adjust COLUMN_ALIASES below if your file uses different headers.
 */
import fs from "node:fs";
import { countFragrances, getDb, insertFragrance } from "../lib/db";

const COLUMN_ALIASES: Record<string, string[]> = {
  brand: ["brand", "company", "house"],
  name: ["name", "perfume", "title", "fragrance"],
  gender: ["gender", "for_gender", "sex"],
  top: ["top", "top_notes", "top notes"],
  middle: ["middle", "middle_notes", "middle notes", "heart", "heart_notes"],
  base: ["base", "base_notes", "base notes"],
  accords: ["accords", "main_accords", "main accords", "mainaccord"],
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s && s !== "unknown" && s !== "n/a");
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run db:import -- path/to/dataset.csv");
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(file, "utf-8"));
if (rows.length < 2) {
  console.error("CSV appears to be empty.");
  process.exit(1);
}

const header = rows[0].map((h) => h.trim().toLowerCase());
const columnIndex: Record<string, number> = {};
for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
  const idx = header.findIndex((h) => aliases.includes(h));
  if (idx !== -1) columnIndex[field] = idx;
}

if (columnIndex.brand === undefined || columnIndex.name === undefined) {
  console.error(
    `Could not find brand/name columns. Found headers: ${header.join(", ")}`,
  );
  process.exit(1);
}

getDb();
let imported = 0;
let skipped = 0;
for (const row of rows.slice(1)) {
  const get = (field: string) =>
    columnIndex[field] !== undefined ? row[columnIndex[field]]?.trim() : undefined;

  const brand = get("brand");
  const name = get("name");
  if (!brand || !name) {
    skipped++;
    continue;
  }
  const top = splitList(get("top"));
  const middle = splitList(get("middle"));
  const base = splitList(get("base"));
  if (top.length + middle.length + base.length === 0) {
    skipped++;
    continue;
  }

  const genderRaw = (get("gender") ?? "").toLowerCase();
  const gender = genderRaw.includes("women")
    ? "women"
    : genderRaw.includes("men")
      ? "men"
      : "unisex";

  insertFragrance(
    {
      brand,
      name,
      gender,
      top_notes: top,
      middle_notes: middle,
      base_notes: base,
      accords: splitList(get("accords")).slice(0, 6),
    },
    "dataset",
  );
  imported++;
}

console.log(
  `Imported ${imported} fragrances (${skipped} rows skipped). Total in database: ${countFragrances()}`,
);
