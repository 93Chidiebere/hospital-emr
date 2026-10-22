import { db } from "./db";
import { hashPassword, verifyPassword } from "./passwords";
import { HOSPITAL_ROLES } from "@/types/emr";

export interface StudentRecord {
  id: string;
  fullName: string;
  role: string;
  /** station chosen for the current class session (null = not chosen yet) */
  sessionRole?: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  locked: boolean;
}

type Row = Record<string, unknown>;
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 5;

export const nameKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();
export const cleanName = (name: string) => name.trim().replace(/\s+/g, " ");

export const STUDENT_ROLE_IDS: string[] = HOSPITAL_ROLES.filter((r) => r.id !== "director").map((r) => r.id);

export type RegisterResult =
  | { ok: true; user: StudentRecord }
  | { ok: false; code: "NAME_TAKEN" | "BAD_NAME" | "BAD_ROLE" | "BAD_PASSWORD"; message: string };

export function validatePassword(pw: string): string | null {
  if (pw.length < 6) return "Password must be at least 6 characters.";
  if (pw.length > 100) return "Password is too long.";
  return null;
}

export async function registerStudent(rawName: string, role: string, password: string): Promise<RegisterResult> {
  const name = cleanName(rawName);
  if (name.length < 2 || name.length > 80) return { ok: false, code: "BAD_NAME", message: "Enter your full name (2 to 80 characters)." };
  if (!STUDENT_ROLE_IDS.includes(role)) return { ok: false, code: "BAD_ROLE", message: "Choose a valid station role." };
  const pwProblem = validatePassword(password);
  if (pwProblem) return { ok: false, code: "BAD_PASSWORD", message: pwProblem };

  const c = await db();
  const id = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const created = new Date().toISOString();
  const hash = await hashPassword(password);
  try {
    await c.execute({
      sql: "INSERT INTO users (id, full_name, name_key, role, password_hash, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, name, nameKey(name), role, hash, created, created],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/unique|constraint/i.test(msg)) {
      return { ok: false, code: "NAME_TAKEN", message: `'${name}' is already registered. Please sign in instead.` };
    }
    throw err;
  }
  return { ok: true, user: { id, fullName: name, role, createdAt: created, lastLoginAt: created, locked: false } };
}

export type LoginResult =
  | { ok: true; user: StudentRecord }
  | { ok: false; code: "BAD_LOGIN" | "LOCKED"; message: string };

export async function loginStudent(rawName: string, password: string): Promise<LoginResult> {
  const c = await db();
  const rs = await c.execute({
    sql: "SELECT id, full_name, role, password_hash, created_at, failed_count, locked_until FROM users WHERE name_key = ?",
    args: [nameKey(rawName)],
  });
  const bad: LoginResult = { ok: false, code: "BAD_LOGIN", message: "Incorrect name or password." };
  if (rs.rows.length === 0) {
    // do comparable work so timing does not reveal whether the name exists
    await verifyPassword(password, "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAA").catch(() => false);
    return bad;
  }
  const row = rs.rows[0] as unknown as Row;

  const lockedUntil = row.locked_until ? new Date(str(row.locked_until)).getTime() : 0;
  if (lockedUntil > Date.now()) {
    const mins = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000));
    return { ok: false, code: "LOCKED", message: `Too many wrong attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}, or ask your teacher to reset your password.` };
  }

  const match = await verifyPassword(password, str(row.password_hash));
  if (!match) {
    const failed = Number(row.failed_count) + 1;
    if (failed >= MAX_FAILED_ATTEMPTS) {
      await c.execute({
        sql: "UPDATE users SET failed_count = 0, locked_until = ? WHERE id = ?",
        args: [new Date(Date.now() + LOCK_MINUTES * 60000).toISOString(), str(row.id)],
      });
    } else {
      await c.execute({ sql: "UPDATE users SET failed_count = ? WHERE id = ?", args: [failed, str(row.id)] });
    }
    return bad;
  }

  const now = new Date().toISOString();
  await c.execute({
    sql: "UPDATE users SET failed_count = 0, locked_until = NULL, last_login_at = ? WHERE id = ?",
    args: [now, str(row.id)],
  });
  return {
    ok: true,
    user: { id: str(row.id), fullName: str(row.full_name), role: str(row.role), createdAt: str(row.created_at), lastLoginAt: now, locked: false },
  };
}

export async function listStudents(): Promise<StudentRecord[]> {
  const c = await db();
  const rs = await c.execute(
    `SELECT u.id, u.full_name, u.role, u.created_at, u.last_login_at, u.locked_until,
            (SELECT sr.role FROM session_roles sr
               WHERE sr.user_id = u.id
                 AND sr.session_id = (SELECT id FROM sessions WHERE status = 'active' ORDER BY created_at DESC LIMIT 1)) AS session_role
       FROM users u ORDER BY u.created_at DESC`
  );
  return rs.rows.map((r) => {
    const row = r as unknown as Row;
    return {
      id: str(row.id),
      fullName: str(row.full_name),
      role: str(row.role),
      sessionRole: row.session_role ? str(row.session_role) : null,
      createdAt: str(row.created_at),
      lastLoginAt: row.last_login_at ? str(row.last_login_at) : null,
      locked: row.locked_until ? new Date(str(row.locked_until)).getTime() > Date.now() : false,
    };
  });
}

export async function resetStudentPassword(id: string, newPassword: string): Promise<boolean> {
  const c = await db();
  const hash = await hashPassword(newPassword);
  const rs = await c.execute({
    sql: "UPDATE users SET password_hash = ?, failed_count = 0, locked_until = NULL WHERE id = ?",
    args: [hash, id],
  });
  return rs.rowsAffected > 0;
}

export async function removeStudent(id: string): Promise<boolean> {
  const c = await db();
  const rs = await c.execute({ sql: "DELETE FROM users WHERE id = ?", args: [id] });
  return rs.rowsAffected > 0;
}
