import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { upsertProduct } from "@/lib/db";
import { fetchAllProducts, wooConfigured } from "@/lib/woocommerce";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!wooConfigured()) {
    return NextResponse.json(
      {
        error:
          "WooCommerce is not configured. Set WOO_URL, WOO_CONSUMER_KEY and WOO_CONSUMER_SECRET in .env.",
      },
      { status: 503 },
    );
  }

  try {
    const products = await fetchAllProducts();
    for (const product of products) {
      upsertProduct({
        woo_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.images?.[0]?.src ?? null,
        permalink: product.permalink,
        in_stock: product.stock_status !== "outofstock",
      });
    }
    return NextResponse.json({ ok: true, count: products.length });
  } catch (error) {
    console.error("Woo sync failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 502 },
    );
  }
}
