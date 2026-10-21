import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Server-side teacher sign-in.
 *  - TEACHER_PASSWORD  (Vercel env var) is the password teachers type on the sign-in screen.
 *  - AUTH_SECRET       (optional) signs the login cookie; falls back to TEACHER_PASSWORD.
 * Reports, exports and "start new session" only work with this signed cookie, so hiding a
 * button in the browser is not the only thing protecting them.
 */

export const TEACHER_COOKIE = "tph_teacher";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export const teacherAuthConfigured = () => Boolean(process.env.TEACHER_PASSWORD);

function secret(): string {
  return process.env.AUTH_SECRET || process.env.TEACHER_PASSWORD || "";
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString("utf8");
const hmac = (data: string) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export function passwordMatches(input: string): boolean {
  const expected = process.env.TEACHER_PASSWORD || "";
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function createToken(name: string): string {
  const payload = b64(JSON.stringify({ name, exp: Date.now() + MAX_AGE_SECONDS * 1000 }));
  return `${payload}.${hmac(payload)}`;
}

export function verifyToken(token: string | undefined): { name: string } | null {
  if (!token || !secret()) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = hmac(payload);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const data = JSON.parse(unb64(payload)) as { name?: string; exp?: number };
    if (!data.exp || data.exp < Date.now()) return null;
    return { name: String(data.name || "Teacher") };
  } catch {
    return null;
  }
}

export function setTeacherCookie(res: NextResponse, name: string) {
  res.cookies.set(TEACHER_COOKIE, createToken(name), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearTeacherCookie(res: NextResponse) {
  res.cookies.set(TEACHER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function currentTeacher(): { name: string } | null {
  return verifyToken(cookies().get(TEACHER_COOKIE)?.value);
}

/** Use at the top of a teacher-only route. */
export function requireTeacher(): { ok: true; name: string } | { ok: false; response: NextResponse } {
  if (!teacherAuthConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "TEACHER_AUTH_NOT_CONFIGURED", message: "Set TEACHER_PASSWORD in the Vercel environment variables." },
        { status: 503 }
      ),
    };
  }
  const teacher = currentTeacher();
  if (!teacher) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "TEACHER_LOGIN_REQUIRED", message: "Sign in as a teacher to use this." },
        { status: 401 }
      ),
    };
  }
  return { ok: true, name: teacher.name };
}
