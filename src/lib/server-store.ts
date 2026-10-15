import { Patient } from "@/types/emr";

/**
 * Server-side storage for LIVE class records (what logged-in students create).
 *
 * - If Upstash Redis credentials exist (added automatically when you connect an
 *   Upstash Redis store to the project in Vercel), records are saved in Redis:
 *   they persist, are shared by every device, and hospital numbers are issued
 *   atomically (no duplicates even if two students register at the same moment).
 * - Otherwise it falls back to in-process memory. That is fine for `npm run dev`,
 *   but on Vercel memory is NOT durable or shared between serverless instances,
 *   so the app warns signed-in users when this happens (see `isEphemeral`).
 *
 * Demo data for visitors who are not signed in never touches this store.
 */

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const HASH_KEY = "tph:live:patients";
const SEQ_KEY = "tph:live:seq";

export const usingRedis = Boolean(REDIS_URL && REDIS_TOKEN);
export const storageKind: "redis" | "memory" = usingRedis ? "redis" : "memory";
// Memory on Vercel is lost/split between instances, so treat it as unsafe there.
export const isEphemeral = !usingRedis && Boolean(process.env.VERCEL);

async function redis(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(REDIS_URL as string, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (!res.ok || json.error) {
    throw new Error(json.error || `Redis request failed (${res.status})`);
  }
  return json.result;
}

// ---------------- in-memory fallback ----------------
declare global {
  // eslint-disable-next-line no-var
  var __TPH_MEM__: { patients: Map<string, Patient>; seq: number } | undefined;
}
function mem() {
  if (!global.__TPH_MEM__) global.__TPH_MEM__ = { patients: new Map(), seq: 0 };
  return global.__TPH_MEM__;
}

const byNewest = (a: Patient, b: Patient) =>
  new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();

export function formatHospitalNumber(seq: number): string {
  return `TPH-${new Date().getFullYear()}-${String(seq).padStart(5, "0")}`;
}

export async function listPatients(): Promise<Patient[]> {
  if (!usingRedis) return Array.from(mem().patients.values()).sort(byNewest);
  const flat = (await redis(["HGETALL", HASH_KEY])) as string[] | null;
  const out: Patient[] = [];
  for (let i = 0; flat && i < flat.length; i += 2) {
    try {
      out.push(JSON.parse(flat[i + 1]) as Patient);
    } catch {
      // skip a corrupted entry rather than failing the whole list
    }
  }
  return out.sort(byNewest);
}

export async function getPatient(idOrNumber: string): Promise<Patient | undefined> {
  if (!usingRedis) {
    const m = mem().patients;
    return m.get(idOrNumber) || Array.from(m.values()).find((p) => p.hospitalNumber === idOrNumber);
  }
  const raw = (await redis(["HGET", HASH_KEY, idOrNumber])) as string | null;
  if (raw) return JSON.parse(raw) as Patient;
  return (await listPatients()).find((p) => p.hospitalNumber === idOrNumber);
}

export async function savePatient(patient: Patient): Promise<Patient> {
  const stored: Patient = { ...patient, lastUpdated: new Date().toISOString() };
  if (!usingRedis) {
    mem().patients.set(stored.id, stored);
    return stored;
  }
  await redis(["HSET", HASH_KEY, stored.id, JSON.stringify(stored)]);
  return stored;
}

/** Issues the next hospital number (1, 2, 3 ...) and stores the new patient. */
export async function createPatient(build: (hospitalNumber: string, id: string) => Patient): Promise<Patient> {
  let seq: number;
  if (!usingRedis) {
    const m = mem();
    m.seq += 1;
    seq = m.seq;
  } else {
    seq = Number(await redis(["INCR", SEQ_KEY]));
  }
  const id = `pat-${Date.now()}-${seq}`;
  return savePatient(build(formatHospitalNumber(seq), id));
}

/** Wipes every live record and restarts numbering at 1. */
export async function clearAllPatients(): Promise<void> {
  if (!usingRedis) {
    global.__TPH_MEM__ = { patients: new Map(), seq: 0 };
    return;
  }
  await redis(["DEL", HASH_KEY]);
  await redis(["DEL", SEQ_KEY]);
}
