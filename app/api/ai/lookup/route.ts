import { NextRequest, NextResponse } from "next/server";
import {
  getCachedLookup,
  getFragrance,
  insertFragrance,
  setCachedLookup,
} from "@/lib/db";
import { aiAvailable, lookupPerfume } from "@/lib/anthropic";
import { normalizeTerm } from "@/lib/similarity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { query } = (await request.json().catch(() => ({}))) as {
    query?: string;
  };
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }
  if (!aiAvailable()) {
    return NextResponse.json(
      { error: "AI lookup is not configured (ANTHROPIC_API_KEY missing)." },
      { status: 503 },
    );
  }

  const normalized = normalizeTerm(query);

  const cached = getCachedLookup(normalized);
  if (cached) {
    const fragrance = cached.fragrance_id
      ? getFragrance(cached.fragrance_id)
      : null;
    return NextResponse.json({ fragrance, cached: true });
  }

  try {
    const result = await lookupPerfume(query.trim());
    if (!result) {
      setCachedLookup(normalized, null);
      return NextResponse.json({ fragrance: null, cached: false });
    }
    const id = insertFragrance(
      {
        brand: result.brand,
        name: result.name,
        gender: result.gender,
        top_notes: result.top_notes,
        middle_notes: result.middle_notes,
        base_notes: result.base_notes,
        accords: result.accords.slice(0, 6),
      },
      "ai",
    );
    setCachedLookup(normalized, id);
    return NextResponse.json({ fragrance: getFragrance(id), cached: false });
  } catch (error) {
    console.error("AI lookup failed:", error);
    return NextResponse.json(
      { error: "AI lookup failed. Please try again." },
      { status: 502 },
    );
  }
}
