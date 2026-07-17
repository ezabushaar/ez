import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getFragrance, getProduct, setProductProfile } from "@/lib/db";
import type { NoteProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const productId = Number(id);
  if (!getProduct(productId)) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    fragranceId?: number | null;
    notesOverride?: NoteProfile | null;
  };

  const fragranceId = body.fragranceId ?? null;
  if (fragranceId !== null && !getFragrance(fragranceId)) {
    return NextResponse.json({ error: "Fragrance not found" }, { status: 404 });
  }

  let override: NoteProfile | null = null;
  if (body.notesOverride) {
    const o = body.notesOverride;
    override = {
      top_notes: (o.top_notes ?? []).filter(Boolean),
      middle_notes: (o.middle_notes ?? []).filter(Boolean),
      base_notes: (o.base_notes ?? []).filter(Boolean),
      accords: (o.accords ?? []).filter(Boolean),
    };
    const total =
      override.top_notes.length +
      override.middle_notes.length +
      override.base_notes.length;
    if (total === 0) override = null;
  }

  setProductProfile(productId, fragranceId, override);
  return NextResponse.json({ ok: true });
}
