# Marsa Fragrance Matcher

A perfume dupe finder + AI marketing tool for **Marsa**:

- **Customers** search any famous designer/niche perfume (e.g. *Baccarat Rouge 540*) and see which **Marsa products** smell most similar — with a % match, shared notes, and a buy link to your WordPress store.
- **The marketing team** gets a private admin area to sync WooCommerce products, map them to fragrance profiles, and generate marketing content with **Claude AI** (Instagram captions, TikTok hooks, product descriptions, ad copy — English & Arabic).

## How it works

1. **Self-hosted fragrance database** (SQLite) — ships with ~75 popular perfumes and their note pyramids/accords, and can import a full public dataset (20k+ perfumes).
2. **Similarity engine** — deterministic scoring, no AI cost per search: weighted note overlap (base notes ×3, heart ×2, top ×1) combined with rank-weighted accord cosine similarity (60/40).
3. **AI fallback** — if a searched perfume isn't in the database, Claude identifies it and returns its structured note pyramid; the result is saved and cached so it's free next time.
4. **WooCommerce sync** — pulls your store's products (name, price, image, link, stock) so matches always link to live products.

## Quick start

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev            # http://localhost:3000
```

The database is created and seeded automatically on first run at `data/marsa.db`.

### Environment variables (`.env`)

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_PASSWORD` | For `/admin` | Password for the marketing team's admin area |
| `ANTHROPIC_API_KEY` | For AI features | Claude API key ([console.anthropic.com](https://console.anthropic.com)) — powers AI perfume lookup + the marketing generator. Without it, the app runs dataset-only. |
| `WOO_URL` | For store sync | Your WordPress store URL, e.g. `https://marsa.example.com` |
| `WOO_CONSUMER_KEY` / `WOO_CONSUMER_SECRET` | For store sync | WooCommerce REST keys — in WordPress go to **WooCommerce → Settings → Advanced → REST API → Add key** (Read permission is enough) |

## Team workflow

1. Sign in at `/admin` and click **Sync WooCommerce products**.
2. Open each product and pick its **"inspired by"** perfume (search the database, or "Ask AI" for anything missing). This gives the product a scent profile.
3. That's it — customers searching that perfume (or anything similar) now see your product ranked by % match.
4. Use **AI marketing generator** to produce copy for any product. The prompt is pre-loaded with the product's scent profile and its "inspired by" match, uses legally-safe phrasing ("inspired by", never "is the original"), and can write English, Arabic, or both.

## Expanding the fragrance database

The bundled starter set covers popular fragrances. To import a large public dataset (e.g. the Fragrantica-derived CSVs on Kaggle):

```bash
npm run db:import -- path/to/dataset.csv
```

Expected columns (case-insensitive, extras ignored): `brand`, `name`/`perfume`, `gender`, `top`/`top_notes`, `middle`/`heart`, `base`/`base_notes`, `accords`/`main_accords`. Note lists may be comma- or semicolon-separated. Adjust `COLUMN_ALIASES` in `scripts/import-csv.ts` if your file uses different headers.

Other scripts: `npm run db:init` (create/seed), `npm run db:seed` (re-apply starter data), `npm test` (similarity engine tests).

## Testing the WooCommerce connection

1. Fill the three `WOO_*` variables in `.env` and restart.
2. Sign in at `/admin` → **Sync WooCommerce products** — you should see "Synced N products".
3. If you get a 401 from Woo, regenerate the REST key and check the store URL uses `https`.

## Tech stack

Next.js 15 (App Router) · TypeScript · SQLite (better-sqlite3) · Tailwind CSS 4 · Claude API (`claude-opus-4-8`) · WooCommerce REST API v3

## Project structure

```
app/                  Pages + API routes (App Router)
  page.tsx            Customer search (home)
  perfume/[id]/       Perfume detail + Marsa matches
  admin/              Admin dashboard, product mapping, marketing generator
  api/                search, match, ai/lookup, ai/marketing, woo/sync, admin auth
lib/                  db, similarity engine, matching, Claude client, Woo client, auth
data/                 Bundled starter dataset (SQLite db is created here, gitignored)
scripts/              db init/seed/import
```
