import { NextResponse } from "next/server";
import { getPatientsStore, setPatientsStore } from "@/lib/server-store";
import { Patient } from "@/types/emr";

export async function GET() {
  const patients = getPatientsStore();
  return NextResponse.json({
    success: true,
    count: patients.length,
    data: patients,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const patients = getPatientsStore();

    if (!body.fullName) {
      return NextResponse.json({ success: false, error: "Full name is required" }, { status: 400 });
    }

    const newId = `pat-${Date.now()}`;
    const nextSeq = patients.length + 101;
    const hospitalNumber = body.hospitalNumber || `TPH-2026-${String(nextSeq).padStart(5, "0")}`;

    const newPatient: Patient = {
      id: newId,
      hospitalNumber,
      fullName: body.fullName,
      age: Number(body.age) || 0,
      gender: body.gender || "Other",
      dateOfBirth: body.dateOfBirth || "2000-01-01",
      phoneNumber: body.phoneNumber || "",
      address: body.address || "",
      nextOfKin: body.nextOfKin || { name: "", relation: "", phone: "" },
      paymentType: body.paymentType || "Out-of-Pocket / Cash",
      registeredAt: new Date().toISOString(),
      registeredBy: body.registeredBy || "Staff Officer (REC)",
      currentDepartment: body.currentDepartment || "TRIAGE",
      lastUpdated: new Date().toISOString(),
      status: "Active",
      vitalsHistory: [],
      doctorNotes: [],
      labOrders: [],
      radiologyOrders: [],
      medications: [],
      routingHistory: [
        {
          id: `rt-${Date.now()}`,
          timestamp: new Date().toISOString(),
          fromDepartment: "RECEPTION",
          toDepartment: body.currentDepartment || "TRIAGE",
          authorizedBy: body.registeredBy || "Staff Officer (REC)",
          reason: body.initialReason || "Patient enrolled at Front Desk and routed.",
        },
      ],
    };

    patients.unshift(newPatient);
    setPatientsStore(patients);

    return NextResponse.json({ success: true, data: newPatient }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
