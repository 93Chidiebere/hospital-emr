import { Patient } from "@/types/emr";
import { INITIAL_DEMO_PATIENTS } from "./demo-data";

// In-memory global store to share patients across API routes and sessions
declare global {
  // eslint-disable-next-line no-var
  var __TRINITY_PATIENTS_STORE__: Patient[] | undefined;
}

export function getPatientsStore(): Patient[] {
  if (!global.__TRINITY_PATIENTS_STORE__) {
    // Clone demo patients deeply so modifications don't mutate the template
    global.__TRINITY_PATIENTS_STORE__ = JSON.parse(JSON.stringify(INITIAL_DEMO_PATIENTS));
  }
  return global.__TRINITY_PATIENTS_STORE__!;
}

export function setPatientsStore(patients: Patient[]): void {
  global.__TRINITY_PATIENTS_STORE__ = patients;
}

export function resetPatientsStore(): Patient[] {
  global.__TRINITY_PATIENTS_STORE__ = JSON.parse(JSON.stringify(INITIAL_DEMO_PATIENTS));
  return global.__TRINITY_PATIENTS_STORE__!;
}

export function findPatientById(id: string): Patient | undefined {
  const store = getPatientsStore();
  return store.find((p) => p.id === id || p.hospitalNumber === id);
}

export function updatePatientInStore(patient: Patient): Patient {
  const store = getPatientsStore();
  const index = store.findIndex((p) => p.id === patient.id);
  if (index >= 0) {
    store[index] = { ...patient, lastUpdated: new Date().toISOString() };
    return store[index];
  } else {
    store.unshift({ ...patient, lastUpdated: new Date().toISOString() });
    return store[0];
  }
}
