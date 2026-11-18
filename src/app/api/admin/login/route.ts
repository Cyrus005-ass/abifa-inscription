import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createSessionToken, safeEqual } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit("login:" + ip, 6, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: "Trop d'essais. Réessaie plus tard." }, { status: 429 });
  }
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !password || !safeEqual(password, expected)) {
    return NextResponse.json({ ok: false, error: "Mot de passe incorrect." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE.name, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE.maxAge,
  });
  return res;
}
