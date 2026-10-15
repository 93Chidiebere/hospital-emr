import { NextResponse } from "next/server";
import { clearAllPatients, createPatient, isEphemeral, listPatients, storageKind } from "@/lib/server-store";
import { Patient } from "@/types/emr";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const patients = await listPatients();
    return NextResponse.json(
      { success: true, count: patients.length, data: patients, storage: storageKind, ephemeral: isEphemeral },
      { headers: noStore }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Storage error";
    return NextResponse.json({ success: false, error: message }, { status: 500, headers: noStore });
  }
}

export async function POST(request: Request) {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Clears ALL live class records and restarts hospital numbers at 1.
export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== "CLEAR") {
      return NextResponse.json({ success: false, error: "Confirmation required" }, { status: 400 });
    }
    await clearAllPatients();
    return NextResponse.json({ success: true, count: 0, data: [] }, { headers: noStore });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
