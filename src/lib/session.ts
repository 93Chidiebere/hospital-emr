import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "./db";

/**
 * Server-side sign-in sessions (students and teachers).
 *  AUTH_SECRET       REQUIRED. A long random text used to sign the login cookie.
 *  TEACHER_PASSWORD  the password teachers type on the Teachers / Admin tab.
 * The cookie is httpOnly (page scripts cannot read it) and signed (it cannot be forged
 * without AUTH_SECRET). Without a valid cookie the patient, report and export routes refuse.
 */

export const SESSION_COOKIE = "tph_session";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export interface SessionUser {
  kind: "student" | "teacher";
  id: string;
  name: string;
  role: string; // station role id (teachers are "director")
}

export const authConfigured = () => (process.env.AUTH_SECRET || "").length >= 16;
export const teacherPasswordConfigured = () => Boolean(process.env.TEACHER_PASSWORD);

/** The old default that is published in the public GitHub repository. */
export function teacherPasswordIsWeak(): boolean {
  const p = process.env.TEACHER_PASSWORD || "";
  return p === "Pass@word1" || p.toLowerCase() === "pass" || p.length < 8;
}

const secret = () => process.env.AUTH_SECRET || "";
const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString("utf8");
const hmac = (data: string) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

export function teacherPasswordMatches(input: string): boolean {
  const expected = process.env.TEACHER_PASSWORD || "";
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function createToken(user: SessionUser): string {
  const payload = b64(JSON.stringify({ ...user, exp: Date.now() + MAX_AGE_SECONDS * 1000 }));
  return `${payload}.${hmac(payload)}`;
}

function verifyToken(token: string | undefined): SessionUser | null {
  if (!token || !authConfigured()) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(hmac(payload));
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const d = JSON.parse(unb64(payload)) as Partial<SessionUser> & { exp?: number };
    if (!d.exp || d.exp < Date.now() || !d.id || !d.name || (d.kind !== "student" && d.kind !== "teacher")) return null;
    return { kind: d.kind, id: String(d.id), name: String(d.name), role: String(d.role || "") };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, user: SessionUser) {
  res.cookies.set(SESSION_COOKIE, createToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function sessionFromCookie(): SessionUser | null {
  return verifyToken(cookies().get(SESSION_COOKIE)?.value);
}

const notConfigured = () =>
  NextResponse.json(
    { success: false, error: "AUTH_NOT_CONFIGURED", message: "The administrator must set AUTH_SECRET in the Vercel environment variables." },
    { status: 503 }
  );

/** Any signed-in student or teacher. Students are re-checked against the database so removed accounts lose access at once. */
export async function requireUser(): Promise<{ ok: true; user: SessionUser } | { ok: false; response: NextResponse }> {
  if (!authConfigured()) return { ok: false, response: notConfigured() };
  const user = sessionFromCookie();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "LOGIN_REQUIRED", message: "Please sign in." }, { status: 401 }),
    };
  }
  if (user.kind === "student") {
    const c = await db();
    const rs = await c.execute({ sql: "SELECT 1 AS ok FROM users WHERE id = ?", args: [user.id] });
    if (rs.rows.length === 0) {
      return {
        ok: false,
        response: NextResponse.json({ success: false, error: "LOGIN_REQUIRED", message: "This account no longer exists." }, { status: 401 }),
      };
    }
  }
  return { ok: true, user };
}

/** Teachers only. */
export async function requireTeacher(): Promise<{ ok: true; name: string } | { ok: false; response: NextResponse }> {
  if (!authConfigured()) return { ok: false, response: notConfigured() };
  if (!teacherPasswordConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "TEACHER_AUTH_NOT_CONFIGURED", message: "Set TEACHER_PASSWORD in the Vercel environment variables." },
        { status: 503 }
      ),
    };
  }
  const user = sessionFromCookie();
  if (!user || user.kind !== "teacher") {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "TEACHER_LOGIN_REQUIRED", message: "Sign in as a teacher to use this." }, { status: 401 }),
    };
  }
  return { ok: true, name: user.name };
}
