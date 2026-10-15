import { NextResponse } from "next/server";
import { getPatient, savePatient } from "@/lib/server-store";
import { Patient } from "@/types/emr";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const patient = await getPatient(params.id);
    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: patient });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Storage error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const updatedData: Patient = await request.json();
    if (!updatedData || updatedData.id !== params.id) {
      return NextResponse.json({ success: false, error: "Patient id mismatch" }, { status: 400 });
    }
    const saved = await savePatient(updatedData);
    return NextResponse.json({ success: true, data: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
