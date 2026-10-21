import { NextResponse } from "next/server";
import { currentTeacher, teacherAuthConfigured } from "@/lib/teacher-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const teacher = currentTeacher();
  return NextResponse.json(
    { configured: teacherAuthConfigured(), teacher: teacher ? teacher.name : null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
