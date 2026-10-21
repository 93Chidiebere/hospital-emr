import { NextResponse } from "next/server";
import { db, dbConfigured } from "@/lib/db";
import { classifyDbError } from "@/lib/api-errors";
import { authConfigured, teacherPasswordConfigured } from "@/lib/session";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

/**
 * Open https://YOUR-SITE/api/health to see what is missing or wrong in the setup.
 * It only reports yes/no and a short explanation. It never shows any secret value.
 */
export async function GET() {
  const checks = {
    TURSO_DATABASE_URL: dbConfigured ? "set" : "MISSING",
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN?.trim() ? "set" : "MISSING",
    AUTH_SECRET: authConfigured() ? "set" : "MISSING or shorter than 16 characters",
    TEACHER_PASSWORD: teacherPasswordConfigured() ? "set" : "MISSING",
  };

  let database: { status: string; problem?: string; message?: string } = {
    status: "not_checked",
    message: "Set TURSO_DATABASE_URL first.",
  };

  if (dbConfigured) {
    try {
      const c = await db(); // also creates the tables the first time (needs a read & write token)
      await c.execute("SELECT 1");
      database = { status: "ok" };
    } catch (err) {
      console.error("[health] database check failed", err);
      const p = classifyDbError(err);
      database = { status: "failed", problem: p.code, message: p.message };
    }
  }

  const allGood =
    database.status === "ok" && authConfigured() && teacherPasswordConfigured() && Boolean(process.env.TURSO_AUTH_TOKEN?.trim());

  return NextResponse.json(
    { ok: allGood, settings: checks, database },
    { status: allGood ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
