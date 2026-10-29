import { Patient } from "@/types/emr";

const DEFAULT_QUEUE_PREVIEW_SIZE = 5;

export function getVisibleQueuePatients(patients: Patient[], search: string) {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const sortedPatients = [...patients].sort((a, b) => {
    const aTime = Date.parse(a.lastUpdated || a.registeredAt) || 0;
    const bTime = Date.parse(b.lastUpdated || b.registeredAt) || 0;
    return bTime - aTime;
  });

  if (normalizedSearch) {
    return sortedPatients.filter((patient) =>
      `${patient.fullName} ${patient.hospitalNumber}`.toLocaleLowerCase().includes(normalizedSearch)
    );
  }

  return sortedPatients.slice(0, DEFAULT_QUEUE_PREVIEW_SIZE);
}
