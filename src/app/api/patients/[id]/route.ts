import { NextResponse } from "next/server";
import { findPatientById, updatePatientInStore } from "@/lib/server-store";
import { Patient } from "@/types/emr";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const patient = findPatientById(params.id);
  if (!patient) {
    return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: patient });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updatedData: Patient = await request.json();
    const updated = updatePatientInStore(updatedData);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
