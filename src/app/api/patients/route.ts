import { NextResponse } from "next/server";
import { createPatient, getActiveSession, listPatients, getRev } from "@/lib/store";
import { errorResponse } from "@/lib/api-errors";
import { requireUser } from "@/lib/session";
import type { Patient } from "@/types/emr";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

// Live records of the ACTIVE class session
export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  try {
    const session = await getActiveSession();
    const [patients, { rev }] = await Promise.all([listPatients(session.id), getRev()]);
    return NextResponse.json(
      {
        success: true,
        count: patients.length,
        data: patients,
        rev,
        session: { id: session.id, name: session.name },
        storage: "turso",
        ephemeral: false,
      },
      { headers: noStore }
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  try {
    const body = await request.json();

    if (!body.fullName || !String(body.fullName).trim()) {
      return NextResponse.json({ success: false, error: "Full name is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const startDept = body.currentDepartment || "TRIAGE";
    const registeredBy = body.registeredBy || "Staff Officer (REC)";

    const created = await createPatient(
      (hospitalNumber, id): Patient => ({
        id,
        hospitalNumber,
        fullName: String(body.fullName).trim(),
        age: Number(body.age) || 0,
        gender: body.gender || "Other",
        dateOfBirth: body.dateOfBirth || "2000-01-01",
        phoneNumber: body.phoneNumber || "",
        address: body.address || "",
        nextOfKin: body.nextOfKin || { name: "", relation: "", phone: "" },
        paymentType: body.paymentType || "Out-of-Pocket / Cash",
        registeredAt: now,
        registeredBy,
        currentDepartment: startDept,
        lastUpdated: now,
        status: "Active",
        vitalsHistory: [],
        doctorNotes: [],
        labOrders: [],
        radiologyOrders: [],
        medications: [],
        routingHistory: [
          {
            id: `rt-${Date.now()}`,
            timestamp: now,
            fromDepartment: "RECEPTION",
            toDepartment: startDept,
            authorizedBy: registeredBy,
            reason: body.initialReason || "Patient enrolled at Front Desk and routed.",
          },
        ],
      })
    );

    return NextResponse.json({ success: true, data: created }, { status: 201, headers: noStore });
  } catch (err) {
    return errorResponse(err);
  }
}
