import { NextResponse } from "next/server";
import { getPatient, savePatient } from "@/lib/store";
import { errorResponse } from "@/lib/api-errors";
import type { Patient } from "@/types/emr";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const patient = await getPatient(params.id);
    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: patient });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const updated: Patient = await request.json();
    if (!updated || updated.id !== params.id) {
      return NextResponse.json({ success: false, error: "Patient id mismatch" }, { status: 400 });
    }
    const saved = await savePatient(updated);
    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    return errorResponse(err);
  }
}
