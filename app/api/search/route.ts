import { NextRequest, NextResponse } from "next/server";
import { searchFragrances } from "@/lib/db";
import { aiAvailable } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ results: [], aiAvailable: aiAvailable() });
  }
  const results = searchFragrances(query, 12);
  return NextResponse.json({ results, aiAvailable: aiAvailable() });
}
