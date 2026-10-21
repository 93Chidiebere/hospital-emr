import { NextResponse } from "next/server";
import { authConfigured, sessionFromCookie, teacherPasswordIsWeak } from "@/lib/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

// Who is signed in (if anyone)? The page asks this when it opens.
export async function GET() {
  const noStore = { "Cache-Control": "no-store" };
  if (!authConfigured()) {
    return NextResponse.json({ configured: false, user: null, warnings: [] }, { headers: noStore });
  }
  const s = sessionFromCookie();
  if (!s) return NextResponse.json({ configured: true, user: null, warnings: [] }, { headers: noStore });

  if (s.kind === "teacher") {
    return NextResponse.json(
      {
        configured: true,
        user: { id: s.id, fullName: s.name, assignedRole: "director", isAdmin: true, createdAt: "" },
        warnings: teacherPasswordIsWeak() ? ["teacher_password_weak"] : [],
      },
      { headers: noStore }
    );
  }

  try {
    const c = await db();
    const rs = await c.execute({ sql: "SELECT id, full_name, role, created_at FROM users WHERE id = ?", args: [s.id] });
    if (rs.rows.length === 0) return NextResponse.json({ configured: true, user: null, warnings: [] }, { headers: noStore });
    const r = rs.rows[0] as unknown as Record<string, unknown>;
    return NextResponse.json(
      {
        configured: true,
        user: { id: String(r.id), fullName: String(r.full_name), assignedRole: String(r.role), createdAt: String(r.created_at) },
        warnings: [],
      },
      { headers: noStore }
    );
  } catch {
    return NextResponse.json({ configured: true, user: null, warnings: [], error: "DB_UNAVAILABLE" }, { headers: noStore });
  }
}
