import { NextResponse } from "next/server";
import { getActiveSession, listPatientsForReport, listSessions } from "@/lib/store";
import { buildSummary } from "@/lib/reports";
import { requireTeacher } from "@/lib/teacher-auth";
import { errorResponse } from "@/lib/api-errors";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = requireTeacher();
  if (!guard.ok) return guard.response;
  try {
    const active = await getActiveSession();
    const requested = new URL(request.url).searchParams.get("session") || active.id;
    const sessions = await listSessions();
    const scope = requested === "all" ? "all" : sessions.find((s) => s.id === requested)?.id || active.id;
    const patients = await listPatientsForReport(scope);
    return NextResponse.json(
      {
        success: true,
        scope,
        activeSessionId: active.id,
        sessions,
        summary: buildSummary(patients),
        patients: patients.map((p) => ({
          hospitalNumber: p.hospitalNumber,
          fullName: p.fullName,
          age: p.age,
          gender: p.gender,
          currentDepartment: p.currentDepartment,
          status: p.status,
          registeredBy: p.registeredBy,
          registeredAt: p.registeredAt,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
