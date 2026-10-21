import { NextResponse } from "next/server";
import { listStudents } from "@/lib/users";
import { requireTeacher } from "@/lib/session";
import { errorResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

export async function GET() {
  const guard = await requireTeacher();
  if (!guard.ok) return guard.response;
  try {
    return NextResponse.json({ success: true, data: await listStudents() }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
