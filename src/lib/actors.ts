import type { Patient } from "@/types/emr";

/** "Ada Obi (REC)" and "ada  obi" are the same person. Used on the server AND in the browser. */
export const actorKey = (name?: string): string =>
  (name || "").trim().replace(/\s*\([A-Za-z]{2,5}\)\s*$/, "").replace(/\s+/g, " ").toLowerCase();

/** Everybody whose name is written on this patient's record (registered, measured, ordered, treated, routed). */
export function collectActorKeys(p: Patient): string[] {
  const names: Array<string | undefined> = [p.registeredBy];
  for (const v of p.vitalsHistory || []) names.push(v.takenBy);
  for (const n of p.doctorNotes || []) names.push(n.doctorName);
  for (const o of p.labOrders || []) names.push(o.doctorName, o.scientistName);
  for (const o of p.radiologyOrders || []) names.push(o.doctorName, o.radiographerName);
  for (const m of p.medications || []) names.push(m.doctorName, m.nurseName);
  for (const r of p.routingHistory || []) names.push(r.authorizedBy);
  return Array.from(new Set(names.map(actorKey).filter(Boolean)));
}

export const handledBy = (p: Patient, personName: string): boolean => collectActorKeys(p).includes(actorKey(personName));
