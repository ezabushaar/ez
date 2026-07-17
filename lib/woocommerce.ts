// Minimal WooCommerce REST API v3 client — products read + sync.
// Auth: consumer key/secret as query params over HTTPS (Woo's documented method).

export interface WooProduct {
  id: number;
  name: string;
  price: string;
  permalink: string;
  stock_status: string;
  images: { src: string }[];
}

export function wooConfigured(): boolean {
  return Boolean(
    process.env.WOO_URL &&
      process.env.WOO_CONSUMER_KEY &&
      process.env.WOO_CONSUMER_SECRET,
  );
}

function wooUrl(path: string, params: Record<string, string> = {}): string {
  const base = process.env.WOO_URL!.replace(/\/$/, "");
  const url = new URL(`${base}/wp-json/wc/v3${path}`);
  url.searchParams.set("consumer_key", process.env.WOO_CONSUMER_KEY!);
  url.searchParams.set("consumer_secret", process.env.WOO_CONSUMER_SECRET!);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Fetch all published products from the store, paginating until exhausted. */
export async function fetchAllProducts(): Promise<WooProduct[]> {
  if (!wooConfigured()) {
    throw new Error(
      "WooCommerce is not configured. Set WOO_URL, WOO_CONSUMER_KEY and WOO_CONSUMER_SECRET.",
    );
  }

  const products: WooProduct[] = [];
  let page = 1;
  for (;;) {
    const response = await fetch(
      wooUrl("/products", {
        per_page: "100",
        page: String(page),
        status: "publish",
      }),
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `WooCommerce API error ${response.status}: ${body.slice(0, 300)}`,
      );
    }
    const batch = (await response.json()) as WooProduct[];
    products.push(...batch);
    if (batch.length < 100) break;
    page += 1;
    if (page > 50) break; // safety cap: 5000 products
  }
  return products;
}
