import { NextResponse } from "next/server";
import { getRev } from "@/lib/store";
import { errorResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

// Cheap "has anything changed?" check used by every open screen (reads one row).
export async function GET() {
  try {
    const { rev, sessionId } = await getRev();
    return NextResponse.json({ success: true, rev, sessionId }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
