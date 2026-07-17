import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "marsa_admin";

function sessionToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return createHmac("sha256", "marsa-admin-session").update(password).digest("hex");
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME);
  if (!cookie) return false;
  const expected = sessionToken();
  const got = cookie.value;
  return (
    got.length === expected.length &&
    timingSafeEqual(Buffer.from(got), Buffer.from(expected))
  );
}
