import { NextResponse } from "next/server";
import { clearTeacherCookie } from "@/lib/teacher-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearTeacherCookie(res);
  return res;
}
