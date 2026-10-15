import { NextResponse } from "next/server";
import { clearAllPatients } from "@/lib/server-store";

export const dynamic = "force-dynamic";

// Kept for backwards compatibility: now clears the live class records (back to zero).
export async function POST() {
  try {
    await clearAllPatients();
    return NextResponse.json({ success: true, count: 0, data: [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
