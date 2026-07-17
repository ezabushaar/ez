import { NextRequest, NextResponse } from "next/server";
import { adminConfigured, checkPassword, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "Admin is not configured. Set ADMIN_PASSWORD in .env." },
      { status: 503 },
    );
  }
  const { password } = (await request.json().catch(() => ({}))) as {
    password?: string;
  };
  if (!password || !checkPassword(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  await createSession();
  return NextResponse.json({ ok: true });
}
