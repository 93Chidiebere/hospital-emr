import { NextResponse } from "next/server";
import { resetPatientsStore } from "@/lib/server-store";

export async function POST() {
  const resetPatients = resetPatientsStore();
  return NextResponse.json({
    success: true,
    message: "Store restored to initial Trinity Point Hospital clinical demo cases",
    count: resetPatients.length,
    data: resetPatients,
  });
}
