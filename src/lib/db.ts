import { createClient, type Client } from "@libsql/client/web";

/**
 * Turso (libSQL) connection for LIVE class records and reports.
 * Environment variables (Vercel > Project > Settings > Environment Variables):
 *   TURSO_DATABASE_URL   e.g. libsql://your-db-name-yourorg.turso.io
 *   TURSO_AUTH_TOKEN     database token created in the Turso dashboard
 */

export class DbNotConfiguredError extends Error {
  constructor() {
    super("DB_NOT_CONFIGURED");
    this.name = "DbNotConfiguredError";
  }
}

// Values pasted into Vercel often carry stray spaces, line breaks or quote marks. Clean them.
const clean = (v: string | undefined) => (v ? v.trim().replace(/^["']+|["']+$/g, "").trim() : undefined) || undefined;

const url = clean(process.env.TURSO_DATABASE_URL);
const authToken = clean(process.env.TURSO_AUTH_TOKEN);

export const dbConfigured = Boolean(url);

let client: Client | null = null;
function getClient(): Client {
  if (!client) {
    client = createClient({
      url: url as string,
      authToken,
      // Next.js caches identical fetch() calls by default, which would make the database
      // return old answers. Always bypass that cache.
      fetch: (input: unknown, init?: unknown) =>
        fetch(input as RequestInfo, { ...((init as RequestInit) || {}), cache: "no-store" }),
    });
  }
  return client;
}

/*
 * Design: each patient is stored as one JSON document (what the app works with) AND the
 * same data is copied into plain tables (vitals, consultations, orders, routing...) every
 * time a patient is saved, so reports and Excel/SPSS/Python analysis can use ordinary
 * rows and columns. Every row carries session_id so each class can be analysed separately.
 */
const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value INTEGER NOT NULL)`,
  `INSERT OR IGNORE INTO meta (key, value) VALUES ('rev', 0)`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    next_seq INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    created_by TEXT,
    archived_at TEXT
  )`,
  `INSERT OR IGNORE INTO sessions (id, name, status, next_seq, created_at, created_by)
     SELECT 'ses-initial', 'Class session 1', 'active', 1, strftime('%Y-%m-%dT%H:%M:%fZ','now'), 'system'
     WHERE NOT EXISTS (SELECT 1 FROM sessions WHERE status = 'active')`,

  `CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    hospital_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    payment_type TEXT,
    current_department TEXT,
    status TEXT,
    registered_at TEXT,
    registered_by TEXT,
    last_updated TEXT,
    next_of_kin_name TEXT,
    next_of_kin_relation TEXT,
    next_of_kin_phone TEXT,
    data TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_patients_session ON patients (session_id)`,

  `CREATE TABLE IF NOT EXISTS vitals (
    id TEXT NOT NULL, patient_id TEXT NOT NULL, session_id TEXT NOT NULL,
    recorded_at TEXT, taken_by TEXT,
    systolic INTEGER, diastolic INTEGER, pulse INTEGER, temperature REAL,
    resp_rate INTEGER, spo2 INTEGER, weight_kg REAL, height_cm REAL, bmi REAL,
    urgency TEXT, chief_complaint TEXT, triage_notes TEXT,
    PRIMARY KEY (patient_id, id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_vitals_session ON vitals (session_id)`,

  `CREATE TABLE IF NOT EXISTS consultations (
    id TEXT NOT NULL, patient_id TEXT NOT NULL, session_id TEXT NOT NULL,
    created_at TEXT, doctor_name TEXT,
    history TEXT, exam_findings TEXT,
    provisional_dx TEXT, provisional_icd10_code TEXT, provisional_icd10_desc TEXT,
    definitive_dx TEXT, definitive_icd10_code TEXT, definitive_icd10_desc TEXT,
    clinical_plan TEXT,
    PRIMARY KEY (patient_id, id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_consultations_session ON consultations (session_id)`,

  `CREATE TABLE IF NOT EXISTS lab_orders (
    id TEXT NOT NULL, patient_id TEXT NOT NULL, session_id TEXT NOT NULL,
    ordered_at TEXT, ordered_by TEXT, test_name TEXT, priority TEXT, indication TEXT,
    status TEXT, completed_at TEXT, completed_by TEXT,
    result TEXT, value TEXT, reference_range TEXT, comments TEXT,
    PRIMARY KEY (patient_id, id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_lab_session ON lab_orders (session_id)`,

  `CREATE TABLE IF NOT EXISTS radiology_orders (
    id TEXT NOT NULL, patient_id TEXT NOT NULL, session_id TEXT NOT NULL,
    ordered_at TEXT, ordered_by TEXT, study_type TEXT, indication TEXT,
    status TEXT, completed_at TEXT, radiographer TEXT, findings TEXT, impression TEXT,
    PRIMARY KEY (patient_id, id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_rad_session ON radiology_orders (session_id)`,

  `CREATE TABLE IF NOT EXISTS medications (
    id TEXT NOT NULL, patient_id TEXT NOT NULL, session_id TEXT NOT NULL,
    ordered_at TEXT, ordered_by TEXT, drug_name TEXT, dosage TEXT, route TEXT,
    frequency TEXT, instructions TEXT, status TEXT,
    administered_at TEXT, nurse_name TEXT, injection_site TEXT, nurse_notes TEXT,
    PRIMARY KEY (patient_id, id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_med_session ON medications (session_id)`,

  `CREATE TABLE IF NOT EXISTS routing_events (
    id TEXT NOT NULL, patient_id TEXT NOT NULL, session_id TEXT NOT NULL,
    occurred_at TEXT, from_dept TEXT, to_dept TEXT, authorized_by TEXT, reason TEXT,
    PRIMARY KEY (patient_id, id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_routing_session ON routing_events (session_id)`,

  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    name_key TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_login_at TEXT,
    failed_count INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT
  )`,
];

let ready: Promise<Client> | null = null;

/** Returns a ready client (creating the tables the first time). */
export function db(): Promise<Client> {
  if (!url) return Promise.reject(new DbNotConfiguredError());
  if (!ready) {
    ready = (async () => {
      const c = getClient();
      await c.batch(SCHEMA, "write");
      return c;
    })().catch((err) => {
      ready = null; // try again on the next request
      throw err;
    });
  }
  return ready;
}
