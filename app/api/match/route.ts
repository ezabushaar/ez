import { NextRequest, NextResponse } from "next/server";
import { getFragrance } from "@/lib/db";
import { matchFragrances, matchProducts } from "@/lib/matching";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("fragranceId"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid fragranceId" }, { status: 400 });
  }
  const fragrance = getFragrance(id);
  if (!fragrance) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    fragrance,
    products: matchProducts(id),
    similar: matchFragrances(id),
  });
}
