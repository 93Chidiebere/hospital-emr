import { NextResponse } from "next/server";
import { passwordMatches, setTeacherCookie, teacherAuthConfigured } from "@/lib/teacher-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!teacherAuthConfigured()) {
    // The site owner has not set TEACHER_PASSWORD yet; the sign-in screen falls back to its old check.
    return NextResponse.json({ success: false, configured: false }, { status: 503 });
  }
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name || "").trim().slice(0, 100);
  const password = String(body?.password || "");

  if (!name || !passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 500)); // slows down password guessing
    return NextResponse.json({ success: false, configured: true, error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ success: true, configured: true, name });
  setTeacherCookie(res, name);
  return res;
}
