import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import {
  getProductProfile,
  insertFragrance,
  searchFragrances,
  setFragranceMedia,
  setProductProfile,
  upsertProduct,
} from "@/lib/db";
import {
  aiAvailable,
  analyzeProductDna,
  findPerfumeMedia,
} from "@/lib/anthropic";
import { fetchAllProducts, wooConfigured } from "@/lib/woocommerce";
import type { NoteProfile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
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

  const reanalyze = request.nextUrl.searchParams.get("reanalyze") === "1";
  const useAi = aiAvailable();

  try {
    const products = await fetchAllProducts();
    let analyzed = 0;
    let mapped = 0;

    for (const product of products) {
      const productId = upsertProduct({
        woo_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.images?.[0]?.src ?? null,
        permalink: product.permalink,
        in_stock: product.stock_status !== "outofstock",
      });

      if (!useAi) continue;

      // Skip products already analysed unless a re-analysis was requested.
      const existing = getProductProfile(productId);
      const alreadyDone =
        existing && (existing.fragrance_id || existing.notes_override);
      if (alreadyDone && !reanalyze) continue;

      const dna = await analyzeProductDna(
        product.name,
        product.description || product.short_description || "",
      );
      if (!dna) continue;
      analyzed++;

      // The product's own scent profile (its DNA), used for matching.
      const override: NoteProfile = {
        top_notes: dna.top_notes ?? [],
        middle_notes: dna.middle_notes ?? [],
        base_notes: dna.base_notes ?? [],
        accords: (dna.accords ?? []).slice(0, 6),
      };

      // Resolve the famous perfume it's inspired by (if AI identified one).
      let fragranceId: number | null = null;
      if (dna.inspiredByName) {
        const label = `${dna.inspiredByBrand} ${dna.inspiredByName}`.trim();
        const matches = searchFragrances(label, 1);
        if (matches.length > 0) {
          fragranceId = matches[0].id;
        } else {
          fragranceId = insertFragrance(
            {
              brand: dna.inspiredByBrand || "Unknown",
              name: dna.inspiredByName,
              gender: dna.gender,
              top_notes: override.top_notes,
              middle_notes: override.middle_notes,
              base_notes: override.base_notes,
              accords: override.accords,
            },
            "ai",
          );
          // Best-effort image/logo for the newly-added reference perfume.
          const media = await findPerfumeMedia(
            dna.inspiredByBrand || "",
            dna.inspiredByName,
          );
          if (media.imageUrl || media.logoUrl) {
            setFragranceMedia(fragranceId, media.imageUrl, media.logoUrl);
          }
        }
        if (fragranceId) mapped++;
      }

      setProductProfile(productId, fragranceId, override);
    }

    return NextResponse.json({
      ok: true,
      count: products.length,
      analyzed,
      mapped,
      aiUsed: useAi,
    });
  } catch (error) {
    console.error("Woo sync failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 502 },
    );
  }
}
