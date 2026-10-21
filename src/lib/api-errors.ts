import { NextResponse } from "next/server";
import { DbNotConfiguredError } from "./db";
import { SessionClosedError } from "./store";

/** Turns storage errors into clear JSON responses. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof DbNotConfiguredError) {
    return NextResponse.json(
      { success: false, error: "DB_NOT_CONFIGURED", message: "The database is not connected yet." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (err instanceof SessionClosedError) {
    return NextResponse.json(
      { success: false, error: "SESSION_CLOSED", message: "This class session has been closed by the teacher." },
      { status: 409 }
    );
  }
  const message = err instanceof Error ? err.message : "Server error";
  return NextResponse.json({ success: false, error: "SERVER_ERROR", message }, { status: 500 });
}
