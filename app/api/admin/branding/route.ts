import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { isAdmin } from "@/lib/auth";
import { DEFAULT_BRANDING, type Branding } from "@/lib/branding";
import { extractBranding } from "@/lib/branding-extract";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Pulls the store's branding (logo, colors, RTL) from its homepage. Runs
// server-side — on the same host as the store, so the 403 that blocks outside
// fetchers doesn't apply.
export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const storeUrl = process.env.WOO_URL;
  if (!storeUrl) {
    return NextResponse.json(
      { error: "WOO_URL is not set — can't find your store." },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(storeUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; MarsaMatcher/1.0; +branding-sync)",
        accept: "text/html",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Store returned HTTP ${res.status} when fetching branding.` },
        { status: 502 },
      );
    }
    const html = await res.text();
    const extracted = extractBranding(html, res.url || storeUrl);
    const branding: Branding = { ...DEFAULT_BRANDING, ...extracted };

    const dataDir = path.join(process.cwd(), "data");
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(
      path.join(dataDir, "branding.json"),
      JSON.stringify(branding, null, 2),
    );

    return NextResponse.json({
      ok: true,
      branding,
      found: {
        logo: Boolean(extracted.logoPath),
        accent: Boolean(extracted.accent),
        rtl: Boolean(extracted.rtl),
      },
    });
  } catch (error) {
    console.error("Branding pull failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Branding pull failed" },
      { status: 502 },
    );
  }
}
