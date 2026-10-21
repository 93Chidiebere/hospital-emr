import { NextResponse } from "next/server";
import { authConfigured, setSessionCookie, teacherPasswordConfigured, teacherPasswordIsWeak, teacherPasswordMatches } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!authConfigured() || !teacherPasswordConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "AUTH_NOT_CONFIGURED",
        message: "Teacher sign-in is not set up yet. The administrator must set TEACHER_PASSWORD and AUTH_SECRET in Vercel.",
      },
      { status: 503 }
    );
  }
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name || "").trim().slice(0, 100);
  const password = String(body?.password || "");

  if (!name || !teacherPasswordMatches(password)) {
    await new Promise((r) => setTimeout(r, 600)); // slows down password guessing
    return NextResponse.json({ success: false, error: "BAD_LOGIN", message: "Incorrect password." }, { status: 401 });
  }

  const id = `teacher-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
  const res = NextResponse.json({
    success: true,
    user: { id, fullName: name, assignedRole: "director", isAdmin: true, createdAt: new Date().toISOString() },
    warnings: teacherPasswordIsWeak() ? ["teacher_password_weak"] : [],
  });
  setSessionCookie(res, { kind: "teacher", id, name, role: "director" });
  return res;
}
