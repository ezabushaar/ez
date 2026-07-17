import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type {
  Fragrance,
  MarsaProduct,
  NoteProfile,
  ProductProfile,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.DATABASE_PATH ?? path.join(DATA_DIR, "marsa.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  migrate(db);
  seedIfEmpty(db);
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fragrances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      name TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'unisex',
      top_notes TEXT NOT NULL DEFAULT '[]',
      middle_notes TEXT NOT NULL DEFAULT '[]',
      base_notes TEXT NOT NULL DEFAULT '[]',
      accords TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'dataset',
      image_url TEXT,
      UNIQUE(brand, name)
    );

    CREATE TABLE IF NOT EXISTS marsa_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      woo_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      price TEXT,
      image_url TEXT,
      permalink TEXT,
      in_stock INTEGER NOT NULL DEFAULT 1,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS product_profiles (
      product_id INTEGER PRIMARY KEY REFERENCES marsa_products(id) ON DELETE CASCADE,
      fragrance_id INTEGER REFERENCES fragrances(id),
      notes_override TEXT
    );

    CREATE TABLE IF NOT EXISTS ai_lookup_cache (
      query TEXT PRIMARY KEY,
      fragrance_id INTEGER REFERENCES fragrances(id),
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_fragrances_name ON fragrances(name);
    CREATE INDEX IF NOT EXISTS idx_fragrances_brand ON fragrances(brand);
  `);
}

function seedIfEmpty(db: Database.Database) {
  const count = db
    .prepare("SELECT COUNT(*) AS n FROM fragrances")
    .get() as { n: number };
  if (count.n > 0) return;

  const starterPath = path.join(DATA_DIR, "starter-fragrances.json");
  if (!fs.existsSync(starterPath)) return;
  const starter = JSON.parse(fs.readFileSync(starterPath, "utf-8"));
  const insertMany = db.transaction((rows: NoteProfile[]) => {
    for (const row of rows) insertFragranceTx(db, row as never, "dataset");
  });
  insertMany(starter);
}

// ---------------------------------------------------------------------------
// Fragrances

interface FragranceRow {
  id: number;
  brand: string;
  name: string;
  gender: string;
  top_notes: string;
  middle_notes: string;
  base_notes: string;
  accords: string;
  source: string;
  image_url: string | null;
}

function rowToFragrance(row: FragranceRow): Fragrance {
  return {
    ...row,
    source: row.source === "ai" ? "ai" : "dataset",
    top_notes: JSON.parse(row.top_notes),
    middle_notes: JSON.parse(row.middle_notes),
    base_notes: JSON.parse(row.base_notes),
    accords: JSON.parse(row.accords),
  };
}

export interface FragranceInput extends NoteProfile {
  brand: string;
  name: string;
  gender?: string;
  image_url?: string | null;
}

function insertFragranceTx(
  db: Database.Database,
  input: FragranceInput,
  source: "dataset" | "ai",
): number {
  const result = db
    .prepare(
      `INSERT INTO fragrances
        (brand, name, gender, top_notes, middle_notes, base_notes, accords, source, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(brand, name) DO UPDATE SET
         gender = excluded.gender,
         top_notes = excluded.top_notes,
         middle_notes = excluded.middle_notes,
         base_notes = excluded.base_notes,
         accords = excluded.accords
       RETURNING id`,
    )
    .get(
      input.brand,
      input.name,
      input.gender ?? "unisex",
      JSON.stringify(input.top_notes ?? []),
      JSON.stringify(input.middle_notes ?? []),
      JSON.stringify(input.base_notes ?? []),
      JSON.stringify(input.accords ?? []),
      source,
      input.image_url ?? null,
    ) as { id: number };
  return result.id;
}

export function insertFragrance(
  input: FragranceInput,
  source: "dataset" | "ai" = "dataset",
): number {
  return insertFragranceTx(getDb(), input, source);
}

export function getFragrance(id: number): Fragrance | null {
  const row = getDb()
    .prepare("SELECT * FROM fragrances WHERE id = ?")
    .get(id) as FragranceRow | undefined;
  return row ? rowToFragrance(row) : null;
}

export function searchFragrances(query: string, limit = 12): Fragrance[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  if (terms.length === 0) return [];

  const where = terms
    .map(() => "(LOWER(brand) || ' ' || LOWER(name)) LIKE ?")
    .join(" AND ");
  const rows = getDb()
    .prepare(
      `SELECT * FROM fragrances WHERE ${where}
       ORDER BY LENGTH(brand || name) ASC LIMIT ?`,
    )
    .all(...terms.map((t) => `%${t}%`), limit) as FragranceRow[];
  return rows.map(rowToFragrance);
}

export function getAllFragrances(): Fragrance[] {
  const rows = getDb()
    .prepare("SELECT * FROM fragrances")
    .all() as FragranceRow[];
  return rows.map(rowToFragrance);
}

export function countFragrances(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM fragrances")
    .get() as { n: number };
  return row.n;
}

// ---------------------------------------------------------------------------
// Marsa products (synced from WooCommerce)

interface ProductRow {
  id: number;
  woo_id: number | null;
  name: string;
  price: string | null;
  image_url: string | null;
  permalink: string | null;
  in_stock: number;
  synced_at: string | null;
}

function rowToProduct(row: ProductRow): MarsaProduct {
  return { ...row, in_stock: row.in_stock === 1 };
}

export interface ProductInput {
  woo_id: number;
  name: string;
  price?: string | null;
  image_url?: string | null;
  permalink?: string | null;
  in_stock?: boolean;
}

export function upsertProduct(input: ProductInput): number {
  const result = getDb()
    .prepare(
      `INSERT INTO marsa_products (woo_id, name, price, image_url, permalink, in_stock, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(woo_id) DO UPDATE SET
         name = excluded.name,
         price = excluded.price,
         image_url = excluded.image_url,
         permalink = excluded.permalink,
         in_stock = excluded.in_stock,
         synced_at = excluded.synced_at
       RETURNING id`,
    )
    .get(
      input.woo_id,
      input.name,
      input.price ?? null,
      input.image_url ?? null,
      input.permalink ?? null,
      input.in_stock === false ? 0 : 1,
    ) as { id: number };
  return result.id;
}

export function listProducts(): MarsaProduct[] {
  const rows = getDb()
    .prepare("SELECT * FROM marsa_products ORDER BY name")
    .all() as ProductRow[];
  return rows.map(rowToProduct);
}

export function getProduct(id: number): MarsaProduct | null {
  const row = getDb()
    .prepare("SELECT * FROM marsa_products WHERE id = ?")
    .get(id) as ProductRow | undefined;
  return row ? rowToProduct(row) : null;
}

// ---------------------------------------------------------------------------
// Product fragrance profiles

export function getProductProfile(productId: number): ProductProfile | null {
  const row = getDb()
    .prepare("SELECT * FROM product_profiles WHERE product_id = ?")
    .get(productId) as
    | { product_id: number; fragrance_id: number | null; notes_override: string | null }
    | undefined;
  if (!row) return null;
  return {
    product_id: row.product_id,
    fragrance_id: row.fragrance_id,
    notes_override: row.notes_override ? JSON.parse(row.notes_override) : null,
  };
}

export function setProductProfile(
  productId: number,
  fragranceId: number | null,
  notesOverride: NoteProfile | null,
): void {
  getDb()
    .prepare(
      `INSERT INTO product_profiles (product_id, fragrance_id, notes_override)
       VALUES (?, ?, ?)
       ON CONFLICT(product_id) DO UPDATE SET
         fragrance_id = excluded.fragrance_id,
         notes_override = excluded.notes_override`,
    )
    .run(
      productId,
      fragranceId,
      notesOverride ? JSON.stringify(notesOverride) : null,
    );
}

/** Effective scent profile of a product: manual override wins, else the mapped fragrance. */
export function getEffectiveProfile(productId: number): NoteProfile | null {
  const profile = getProductProfile(productId);
  if (!profile) return null;
  if (profile.notes_override) return profile.notes_override;
  if (profile.fragrance_id) {
    const fragrance = getFragrance(profile.fragrance_id);
    if (fragrance) return fragrance;
  }
  return null;
}

// ---------------------------------------------------------------------------
// AI lookup cache

export function getCachedLookup(
  query: string,
): { fragrance_id: number | null } | null {
  const row = getDb()
    .prepare("SELECT fragrance_id FROM ai_lookup_cache WHERE query = ?")
    .get(query) as { fragrance_id: number | null } | undefined;
  return row ?? null;
}

export function setCachedLookup(query: string, fragranceId: number | null) {
  getDb()
    .prepare(
      `INSERT INTO ai_lookup_cache (query, fragrance_id, created_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(query) DO UPDATE SET
         fragrance_id = excluded.fragrance_id,
         created_at = excluded.created_at`,
    )
    .run(query, fragranceId);
}
