import { NextResponse } from "next/server";
import { updateStudentEmail } from "@/lib/users";
import { authConfigured, sessionFromCookie } from "@/lib/session";
import { errorResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!authConfigured()) return NextResponse.json({ success: false, message: "Sign-in is not set up yet." }, { status: 503 });
  const session = sessionFromCookie();
  if (!session || session.kind !== "student") return NextResponse.json({ success: false, message: "Please sign in again." }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const result = await updateStudentEmail(session.id, String(body?.email || ""));
    if (!result.ok) return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    return NextResponse.json({ success: true, email: result.email });
  } catch (err) {
    return errorResponse(err);
  }
}
