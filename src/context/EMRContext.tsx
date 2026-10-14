"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Patient,
  RoleId,
  Department,
  HOSPITAL_ROLES,
  VitalsRecord,
  DoctorNote,
  LabOrder,
  RadiologyOrder,
  MedicationAdministration,
  RoutingEvent,
} from "@/types/emr";
import { INITIAL_DEMO_PATIENTS } from "@/lib/demo-data";

interface EMRContextType {
  patients: Patient[];
  loading: boolean;
  activeRole: RoleId;
  activeStaffName: string;
  selectedPatient: Patient | null;
  filterDepartment: Department | "ALL";
  searchQuery: string;
  setActiveRole: (role: RoleId) => void;
  setActiveStaffName: (name: string) => void;
  setSelectedPatient: (patient: Patient | null) => void;
  setFilterDepartment: (dept: Department | "ALL") => void;
  setSearchQuery: (query: string) => void;
  registerPatient: (data: Partial<Patient>, initialRoute?: Department, reason?: string) => Promise<Patient>;
  recordVitals: (patientId: string, vitals: Omit<VitalsRecord, "id" | "timestamp" | "takenBy">, nextDept?: Department, routingReason?: string) => Promise<void>;
  saveDoctorConsultation: (
    patientId: string,
    notes: Omit<DoctorNote, "id" | "timestamp" | "doctorName">,
    labOrders: Omit<LabOrder, "id" | "timestampOrdered" | "doctorName" | "status">[],
    radiologyOrders: Omit<RadiologyOrder, "id" | "timestampOrdered" | "doctorName" | "status">[],
    medications: Omit<MedicationAdministration, "id" | "timestampOrdered" | "doctorName" | "status">[],
    routeToDept?: Department,
    routingReason?: string
  ) => Promise<void>;
  completeLabOrder: (
    patientId: string,
    orderId: string,
    resultFindings: string,
    quantitativeValue?: string,
    referenceRange?: string,
    scientistComments?: string,
    routeToDept?: Department,
    routingReason?: string
  ) => Promise<void>;
  completeRadiologyOrder: (
    patientId: string,
    orderId: string,
    findingsReport: string,
    impression: string,
    routeToDept?: Department,
    routingReason?: string
  ) => Promise<void>;
  administerMedication: (
    patientId: string,
    medId: string,
    injectionSite?: string,
    nurseNotes?: string,
    routeToDept?: Department,
    routingReason?: string
  ) => Promise<void>;
  transferPatient: (patientId: string, targetDept: Department, reason: string) => Promise<void>;
  dischargePatient: (patientId: string, dischargeReason: string) => Promise<void>;
  resetToDemoCases: () => Promise<void>;
  refresh: () => Promise<void>;
}

const EMRContext = createContext<EMRContextType | undefined>(undefined);

export function EMRProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const [activeRole, setActiveRole] = useState<RoleId>("director");
  const [activeStaffName, setActiveStaffName] = useState<string>("Clinical Supervisor");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<Department | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync role title to staff name if user hasn't customized
  // (skipped for signed-in accounts so their own name is never overwritten)
  useEffect(() => {
    if (currentUser) return;
    const roleMeta = HOSPITAL_ROLES.find((r) => r.id === activeRole);
    if (roleMeta) {
      if (activeRole === "receptionist") setActiveStaffName("Staff Officer M. Bello (REC)");
      else if (activeRole === "triage_nurse") setActiveStaffName("Staff Nurse R. Johnson (TRG)");
      else if (activeRole === "doctor") setActiveStaffName("Dr. K. Adeyemi, FWACP (DOC)");
      else if (activeRole === "mls") setActiveStaffName("MLS E. Chukwuma, AMLSCN (MLS)");
      else if (activeRole === "radiographer") setActiveStaffName("Radiographer S. Ojo (RAD)");
      else if (activeRole === "treatment_nurse") setActiveStaffName("Pharmacist T. Dike (PHM)");
      else setActiveStaffName("Prof. J. C. Okon, Medical Director");
    }
  }, [activeRole, currentUser]);

  // Load patients from API or fallback to localStorage / Demo data
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setPatients(json.data);
          localStorage.setItem("trinity_point_patients", JSON.stringify(json.data));
          setLoading(false);
          return;
        }
      }
    } catch {
      // offline or serverless fallback
    }

    // Try localStorage
    const cached = localStorage.getItem("trinity_point_patients");
    if (cached) {
      try {
        setPatients(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        // ignore parse error
      }
    }

    // Fallback to initial demo cases
    setPatients(INITIAL_DEMO_PATIENTS);
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Keep selectedPatient updated when master list updates
  useEffect(() => {
    if (selectedPatient) {
      const updated = patients.find((p) => p.id === selectedPatient.id);
      if (updated) setSelectedPatient(updated);
    }
  }, [patients]);

  const savePatientToRemote = async (updatedPatient: Patient) => {
    // Optimistic local update
    setPatients((prev) => {
      const next = prev.map((p) => (p.id === updatedPatient.id ? updatedPatient : p));
      localStorage.setItem("trinity_point_patients", JSON.stringify(next));
      return next;
    });

    try {
      await fetch(`/api/patients/${updatedPatient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPatient),
      });
    } catch {
      // client-side persistence remains active
    }
  };

  const registerPatient = async (
    data: Partial<Patient>,
    initialRoute: Department = "TRIAGE",
    reason: string = "Patient enrolled at Front Desk and routed for clinical assessment."
  ): Promise<Patient> => {
    const nextSeq = patients.length + 101;
    const hospitalNumber = `TPH-2026-${String(nextSeq).padStart(5, "0")}`;
    const newId = `pat-${Date.now()}`;

    const newPatient: Patient = {
      id: newId,
      hospitalNumber,
      fullName: data.fullName || "Unnamed Patient",
      age: Number(data.age) || 0,
      gender: data.gender || "Other",
      dateOfBirth: data.dateOfBirth || "2000-01-01",
      phoneNumber: data.phoneNumber || "",
      address: data.address || "",
      nextOfKin: data.nextOfKin || { name: "", relation: "", phone: "" },
      paymentType: data.paymentType || "Out-of-Pocket / Cash",
      registeredAt: new Date().toISOString(),
      registeredBy: activeStaffName,
      currentDepartment: initialRoute,
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
          toDepartment: initialRoute,
          authorizedBy: activeStaffName,
          reason,
        },
      ],
    };

    setPatients((prev) => {
      const next = [newPatient, ...prev];
      localStorage.setItem("trinity_point_patients", JSON.stringify(next));
      return next;
    });

    try {
      await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPatient),
      });
    } catch {
      // optimistic state preserved
    }

    return newPatient;
  };

  const recordVitals = async (
    patientId: string,
    vitals: Omit<VitalsRecord, "id" | "timestamp" | "takenBy">,
    nextDept: Department = "CONSULTATION",
    routingReason: string = "Vitals recorded; patient routed for clinical consultation."
  ) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (!p) return;

    const newVitalsRecord: VitalsRecord = {
      ...vitals,
      id: `vit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      takenBy: activeStaffName,
    };

    const newRouting: RoutingEvent = {
      id: `rt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromDepartment: p.currentDepartment,
      toDepartment: nextDept,
      authorizedBy: activeStaffName,
      reason: routingReason,
    };

    const updated: Patient = {
      ...p,
      vitalsHistory: [newVitalsRecord, ...p.vitalsHistory],
      currentDepartment: nextDept,
      routingHistory: [...p.routingHistory, newRouting],
      lastUpdated: new Date().toISOString(),
    };

    await savePatientToRemote(updated);
  };

  const saveDoctorConsultation = async (
    patientId: string,
    notes: Omit<DoctorNote, "id" | "timestamp" | "doctorName">,
    newLabOrders: Omit<LabOrder, "id" | "timestampOrdered" | "doctorName" | "status">[],
    newRadiologyOrders: Omit<RadiologyOrder, "id" | "timestampOrdered" | "doctorName" | "status">[],
    newMedications: Omit<MedicationAdministration, "id" | "timestampOrdered" | "doctorName" | "status">[],
    routeToDept?: Department,
    routingReason?: string
  ) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (!p) return;

    const newNote: DoctorNote = {
      ...notes,
      id: `doc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      doctorName: activeStaffName,
    };

    const createdLabs: LabOrder[] = newLabOrders.map((lo, idx) => ({
      ...lo,
      id: `lab-${Date.now()}-${idx}`,
      timestampOrdered: new Date().toISOString(),
      doctorName: activeStaffName,
      status: "pending",
    }));

    const createdRads: RadiologyOrder[] = newRadiologyOrders.map((ro, idx) => ({
      ...ro,
      id: `rad-${Date.now()}-${idx}`,
      timestampOrdered: new Date().toISOString(),
      doctorName: activeStaffName,
      status: "pending",
    }));

    const createdMeds: MedicationAdministration[] = newMedications.map((m, idx) => ({
      ...m,
      id: `med-${Date.now()}-${idx}`,
      timestampOrdered: new Date().toISOString(),
      doctorName: activeStaffName,
      status: "pending",
    }));

    // Determine target department automatically if not explicitly given
    let target = routeToDept || p.currentDepartment;
    let defReason = routingReason || "Doctor consultation completed.";
    if (!routeToDept) {
      if (createdLabs.length > 0) {
        target = "LABORATORY";
        defReason = `Referred to Medical Laboratory for ${createdLabs.length} investigation(s).`;
      } else if (createdRads.length > 0) {
        target = "RADIOLOGY";
        defReason = `Referred to Diagnostic Imaging for ${createdRads.length} study(ies).`;
      } else if (createdMeds.length > 0) {
        target = "TREATMENT";
        defReason = `Referred to Pharmacy for dispensing and administration of prescribed therapy.`;
      }
    }

    const newRouting: RoutingEvent = {
      id: `rt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromDepartment: p.currentDepartment,
      toDepartment: target,
      authorizedBy: activeStaffName,
      reason: defReason,
    };

    const updated: Patient = {
      ...p,
      doctorNotes: [newNote, ...p.doctorNotes],
      labOrders: [...p.labOrders, ...createdLabs],
      radiologyOrders: [...p.radiologyOrders, ...createdRads],
      medications: [...p.medications, ...createdMeds],
      currentDepartment: target,
      routingHistory: [...p.routingHistory, newRouting],
      lastUpdated: new Date().toISOString(),
    };

    await savePatientToRemote(updated);
  };

  const completeLabOrder = async (
    patientId: string,
    orderId: string,
    resultFindings: string,
    quantitativeValue?: string,
    referenceRange?: string,
    scientistComments?: string,
    routeToDept: Department = "CONSULTATION",
    routingReason: string = "Laboratory test finalized; specimen reports routed back to Physician."
  ) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (!p) return;

    const updatedOrders = p.labOrders.map((lo) => {
      if (lo.id === orderId) {
        return {
          ...lo,
          status: "completed" as const,
          timestampCompleted: new Date().toISOString(),
          scientistName: activeStaffName,
          resultFindings,
          quantitativeValue,
          referenceRange,
          scientistComments,
        };
      }
      return lo;
    });

    const newRouting: RoutingEvent = {
      id: `rt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromDepartment: p.currentDepartment,
      toDepartment: routeToDept,
      authorizedBy: activeStaffName,
      reason: routingReason,
    };

    const updated: Patient = {
      ...p,
      labOrders: updatedOrders,
      currentDepartment: routeToDept,
      routingHistory: [...p.routingHistory, newRouting],
      lastUpdated: new Date().toISOString(),
    };

    await savePatientToRemote(updated);
  };

  const completeRadiologyOrder = async (
    patientId: string,
    orderId: string,
    findingsReport: string,
    impression: string,
    routeToDept: Department = "CONSULTATION",
    routingReason: string = "Radiological scan evaluated; imaging findings returned to Physician."
  ) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (!p) return;

    const updatedRads = p.radiologyOrders.map((ro) => {
      if (ro.id === orderId) {
        return {
          ...ro,
          status: "completed" as const,
          timestampCompleted: new Date().toISOString(),
          radiographerName: activeStaffName,
          findingsReport,
          impression,
        };
      }
      return ro;
    });

    const newRouting: RoutingEvent = {
      id: `rt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromDepartment: p.currentDepartment,
      toDepartment: routeToDept,
      authorizedBy: activeStaffName,
      reason: routingReason,
    };

    const updated: Patient = {
      ...p,
      radiologyOrders: updatedRads,
      currentDepartment: routeToDept,
      routingHistory: [...p.routingHistory, newRouting],
      lastUpdated: new Date().toISOString(),
    };

    await savePatientToRemote(updated);
  };

  const administerMedication = async (
    patientId: string,
    medId: string,
    injectionSite: string = "Left Deltoid / IV Port",
    nurseNotes: string = "Administered as prescribed without acute adverse event.",
    routeToDept?: Department,
    routingReason?: string
  ) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (!p) return;

    const updatedMeds = p.medications.map((m) => {
      if (m.id === medId) {
        return {
          ...m,
          status: "administered" as const,
          timestampAdministered: new Date().toISOString(),
          nurseName: activeStaffName,
          injectionSite,
          nurseNotes,
        };
      }
      return m;
    });

    const targetDept = routeToDept || p.currentDepartment;
    const reasonText = routingReason || "Medication administration logged by Nursing Staff.";

    const newRouting: RoutingEvent = {
      id: `rt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromDepartment: p.currentDepartment,
      toDepartment: targetDept,
      authorizedBy: activeStaffName,
      reason: reasonText,
    };

    const updated: Patient = {
      ...p,
      medications: updatedMeds,
      currentDepartment: targetDept,
      routingHistory: [...p.routingHistory, newRouting],
      lastUpdated: new Date().toISOString(),
    };

    await savePatientToRemote(updated);
  };

  const transferPatient = async (patientId: string, targetDept: Department, reason: string) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (!p) return;

    const newRouting: RoutingEvent = {
      id: `rt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fromDepartment: p.currentDepartment,
      toDepartment: targetDept,
      authorizedBy: activeStaffName,
      reason: reason || `Patient moved to ${targetDept} station.`,
    };

    const updated: Patient = {
      ...p,
      currentDepartment: targetDept,
      status: targetDept === "DISCHARGED" ? "Discharged" : "Active",
      routingHistory: [...p.routingHistory, newRouting],
      lastUpdated: new Date().toISOString(),
    };

    await savePatientToRemote(updated);
  };

  const dischargePatient = async (patientId: string, dischargeReason: string) => {
    await transferPatient(patientId, "DISCHARGED", dischargeReason || "Clinical episode concluded; discharged home.");
  };

  const resetToDemoCases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/patients/reset", { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setPatients(json.data);
        localStorage.setItem("trinity_point_patients", JSON.stringify(json.data));
        setLoading(false);
        return;
      }
    } catch {
      // offline reset
    }

    const resetClone = JSON.parse(JSON.stringify(INITIAL_DEMO_PATIENTS));
    setPatients(resetClone);
    localStorage.setItem("trinity_point_patients", JSON.stringify(resetClone));
    setLoading(false);
  };

  return (
    <EMRContext.Provider
      value={{
        patients,
        loading,
        activeRole,
        activeStaffName,
        selectedPatient,
        filterDepartment,
        searchQuery,
        setActiveRole,
        setActiveStaffName,
        setSelectedPatient,
        setFilterDepartment,
        setSearchQuery,
        registerPatient,
        recordVitals,
        saveDoctorConsultation,
        completeLabOrder,
        completeRadiologyOrder,
        administerMedication,
        transferPatient,
        dischargePatient,
        resetToDemoCases,
        refresh: fetchPatients,
      }}
    >
      {children}
    </EMRContext.Provider>
  );
}

export function useEMR() {
  const context = useContext(EMRContext);
  if (!context) {
    throw new Error("useEMR must be used within an EMRProvider");
  }
  return context;
}
