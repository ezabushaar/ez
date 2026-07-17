import fs from "node:fs";
import path from "node:path";
import { countFragrances, getDb, insertFragrance } from "../lib/db";
import type { FragranceInput } from "../lib/db";

// Re-applies the bundled starter dataset (upserting by brand+name).
getDb();
const starterPath = path.join(process.cwd(), "data", "starter-fragrances.json");
const starter = JSON.parse(fs.readFileSync(starterPath, "utf-8")) as FragranceInput[];
for (const fragrance of starter) {
  insertFragrance(fragrance, "dataset");
}
console.log(
  `Seeded ${starter.length} starter fragrances. Total in database: ${countFragrances()}`,
);
