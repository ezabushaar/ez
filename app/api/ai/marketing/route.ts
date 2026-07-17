import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getEffectiveProfile, getFragrance, getProduct, getProductProfile } from "@/lib/db";
import {
  aiAvailable,
  generateMarketing,
  type ContentType,
  type Language,
} from "@/lib/anthropic";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CONTENT_TYPES = new Set([
  "instagram_caption",
  "tiktok_hook",
  "product_description",
  "ad_copy",
]);
const LANGUAGES = new Set(["english", "arabic", "both"]);

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!aiAvailable()) {
    return NextResponse.json(
      { error: "AI is not configured (ANTHROPIC_API_KEY missing)." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    productId?: number;
    contentType?: string;
    language?: string;
    extraInstructions?: string;
  };

  const product = body.productId ? getProduct(body.productId) : null;
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  if (!body.contentType || !CONTENT_TYPES.has(body.contentType)) {
    return NextResponse.json({ error: "Invalid contentType" }, { status: 400 });
  }
  if (!body.language || !LANGUAGES.has(body.language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const profile = getProductProfile(product.id);
  const inspiredBy = profile?.fragrance_id
    ? getFragrance(profile.fragrance_id)
    : null;

  try {
    const content = await generateMarketing({
      productName: product.name,
      price: product.price,
      inspiredBy,
      profile: getEffectiveProfile(product.id),
      contentType: body.contentType as ContentType,
      language: body.language as Language,
      extraInstructions: body.extraInstructions?.slice(0, 2000),
    });
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Marketing generation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 502 },
    );
  }
}
