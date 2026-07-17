import { countFragrances, getDb } from "../lib/db";

getDb();
console.log(`Database ready. Fragrances loaded: ${countFragrances()}`);
