"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Download, RefreshCw, ShieldAlert } from "lucide-react";

interface SessionInfo {
  id: string;
  name: string;
  status: "active" | "archived";
  createdAt: string;
  patientCount?: number;
}

interface Summary {
  totals: Record<string, number>;
  byStation: Array<{ dept: string; name: string; count: number }>;
  avgMinutesAtStation: Array<{ dept: string; name: string; avgMinutes: number; visits: number }>;
  avgMinutesToDischarge: number | null;
  topDiagnoses: Array<{ code: string; description: string; count: number }>;
  uncodedConsultations: number;
  demographics: {
    gender: Array<{ label: string; count: number }>;
    payment: Array<{ label: string; count: number }>;
    ageGroups: Array<{ label: string; count: number }>;
  };
  activity: Array<{
    name: string;
    patientsRegistered: number;
    vitalsRecorded: number;
    consultations: number;
    labResults: number;
    imagingReports: number;
    medicationsGiven: number;
    patientsRouted: number;
  }>;
}

interface PatientRow {
  hospitalNumber: string;
  fullName: string;
  age: number;
  gender: string;
  currentDepartment: string;
  status: string;
  registeredBy: string;
  registeredAt: string;
}

interface ReportResponse {
  success: boolean;
  scope: string;
  activeSessionId: string;
  sessions: SessionInfo[];
  summary: Summary;
  patients: PatientRow[];
}

const EXPORTS: Array<{ table: string; label: string; hint: string }> = [
  { table: "patients", label: "Patients", hint: "One row per patient" },
  { table: "vitals", label: "Vital signs", hint: "Triage readings" },
  { table: "consultations", label: "Consultations + ICD-10", hint: "Diagnoses with codes" },
  { table: "lab_orders", label: "Laboratory orders", hint: "Tests and results" },
  { table: "radiology_orders", label: "Imaging orders", hint: "Studies and reports" },
  { table: "medications", label: "Pharmacy / medications", hint: "Orders and administration" },
  { table: "routing_events", label: "Patient flow", hint: "Every move between stations" },
];

function Bars({ rows, unit = "" }: { rows: Array<{ label: string; value: number }>; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-slate-500">No data yet.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-800 truncate">{r.label}</span>
            <span className="font-mono font-bold text-navy-dark shrink-0">
              {r.value}
              {unit}
            </span>
          </div>
          <div className="h-2.5 bg-slate-100" aria-hidden="true">
            <div className="h-2.5 bg-brand" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-paper-border p-4 sm:p-5">
      <h2 className="font-sans text-base font-bold text-navy-dark mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Kpi({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white border border-paper-border p-4">
      <div className="text-[11px] uppercase font-mono text-slate-600">{label}</div>
      <div className="text-3xl font-bold text-navy-dark mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ReportsPage() {
  const [scope, setScope] = useState<string>("");
  const [data, setData] = useState<ReportResponse | null>(null);
  const [problem, setProblem] = useState<{ title: string; detail: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (session?: string) => {
    setLoading(true);
    setProblem(null);
    try {
      const res = await fetch(`/api/reports/summary${session ? `?session=${encodeURIComponent(session)}` : ""}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setProblem({
          title: "Teacher sign-in required",
          detail:
            "Reports are only available to teachers. Go back to the platform, choose Teachers / Admin, select your name and enter your password.",
        });
      } else if (res.status === 503 && json?.error === "TEACHER_AUTH_NOT_CONFIGURED") {
        setProblem({
          title: "Reports are not switched on yet",
          detail:
            "The site owner needs to add a TEACHER_PASSWORD setting in Vercel (Settings, Environment Variables) and redeploy.",
        });
      } else if (res.status === 503) {
        setProblem({
          title: "The database is not connected yet",
          detail:
            "The site owner needs to add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel (Settings, Environment Variables) and redeploy.",
        });
      } else if (!res.ok) {
        setProblem({ title: "Could not load the report", detail: json?.message || `Server returned ${res.status}.` });
      } else {
        setData(json as ReportResponse);
        setScope((json as ReportResponse).scope);
      }
    } catch {
      setProblem({ title: "Could not reach the server", detail: "Check your internet connection and try again." });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const s = data?.summary;
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-paper-warm text-slate-900">
      <header className="bg-navy text-white border-b border-navy-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-sans text-xl sm:text-2xl font-bold">Class Reports & Data Downloads</h1>
            <p className="text-xs text-amber-300 font-mono">Trinity University Hospital EHR (teachers only)</p>
          </div>
          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 text-xs bg-white/10 hover:bg-white/20 border border-white/20"
          >
            <ArrowLeft aria-hidden="true" className="w-3.5 h-3.5 text-brand" />
            Back to the platform
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {problem && (
          <div role="alert" className="bg-amber-50 border border-amber-300 p-5 flex gap-3">
            <ShieldAlert aria-hidden="true" className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-amber-900">{problem.title}</h2>
              <p className="text-sm text-amber-900 mt-1">{problem.detail}</p>
            </div>
          </div>
        )}

        {!problem && loading && !data && <p className="text-sm text-slate-600">Loading report...</p>}

        {!problem && data && s && (
          <>
            {/* Session picker */}
            <div className="bg-white border border-paper-border p-4 flex flex-wrap items-end gap-3">
              <div className="grow min-w-[14rem]">
                <label htmlFor="session-select" className="block text-[11px] uppercase font-mono text-slate-600 mb-1">
                  Class session
                </label>
                <select
                  id="session-select"
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value);
                    load(e.target.value);
                  }}
                  className="w-full p-2.5 border border-slate-300 bg-white text-sm"
                >
                  <option value="all">All sessions combined</option>
                  {data.sessions.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name} {x.status === "active" ? "(current)" : "(closed)"} · {x.patientCount ?? 0} patients
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => load(scope)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm border border-slate-300 hover:bg-slate-50"
              >
                <RefreshCw aria-hidden="true" className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Patients registered" value={s.totals.patients} sub={`${s.totals.active} in clinic, ${s.totals.discharged} discharged`} />
              <Kpi label="Consultations" value={s.totals.consultations} sub={`${s.uncodedConsultations} without an ICD-10 code`} />
              <Kpi label="Lab tests" value={s.totals.labOrders} sub={`${s.totals.labCompleted} reported`} />
              <Kpi label="Imaging studies" value={s.totals.imagingOrders} sub={`${s.totals.imagingCompleted} reported`} />
              <Kpi label="Vital sign sets" value={s.totals.vitals} />
              <Kpi label="Medications ordered" value={s.totals.medications} sub={`${s.totals.medicationsAdministered} given`} />
              <Kpi
                label="Avg. time to discharge"
                value={s.avgMinutesToDischarge === null ? "n/a" : `${s.avgMinutesToDischarge} min`}
                sub="From registration to discharge"
              />
              <Kpi label="Students active" value={s.activity.length} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card title="Where patients are now">
                <Bars rows={s.byStation.map((x) => ({ label: x.name, value: x.count }))} />
              </Card>
              <Card title="Average time at each station (minutes)">
                <Bars rows={s.avgMinutesAtStation.map((x) => ({ label: `${x.name} (${x.visits} visits)`, value: x.avgMinutes }))} unit=" min" />
              </Card>
              <Card title="Most frequent diagnoses (ICD-10)">
                {s.topDiagnoses.length === 0 ? (
                  <p className="text-sm text-slate-500">No coded diagnoses yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase font-mono text-slate-600 border-b border-slate-200">
                        <th scope="col" className="py-1.5 pr-2">Code</th>
                        <th scope="col" className="py-1.5 pr-2">Description</th>
                        <th scope="col" className="py-1.5 text-right">Cases</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.topDiagnoses.map((d) => (
                        <tr key={d.code} className="border-b border-slate-100">
                          <td className="py-1.5 pr-2 font-mono font-bold text-navy-dark">{d.code}</td>
                          <td className="py-1.5 pr-2">{d.description}</td>
                          <td className="py-1.5 text-right font-bold">{d.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
              <Card title="Patient profile">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-mono uppercase text-slate-600 mb-1.5">Gender</h3>
                    <Bars rows={s.demographics.gender.map((x) => ({ label: x.label, value: x.count }))} />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono uppercase text-slate-600 mb-1.5">Age group</h3>
                    <Bars rows={s.demographics.ageGroups.map((x) => ({ label: x.label, value: x.count }))} />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono uppercase text-slate-600 mb-1.5">Payment type</h3>
                    <Bars rows={s.demographics.payment.map((x) => ({ label: x.label, value: x.count }))} />
                  </div>
                </div>
              </Card>
            </div>

            <Card title="Student activity">
              {s.activity.length === 0 ? (
                <p className="text-sm text-slate-500">No student entries yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[40rem]">
                    <thead>
                      <tr className="text-left text-[11px] uppercase font-mono text-slate-600 border-b border-slate-200">
                        <th scope="col" className="py-1.5 pr-2">Name (as signed)</th>
                        <th scope="col" className="py-1.5 px-2 text-right">Registered</th>
                        <th scope="col" className="py-1.5 px-2 text-right">Vitals</th>
                        <th scope="col" className="py-1.5 px-2 text-right">Consults</th>
                        <th scope="col" className="py-1.5 px-2 text-right">Lab</th>
                        <th scope="col" className="py-1.5 px-2 text-right">Imaging</th>
                        <th scope="col" className="py-1.5 px-2 text-right">Meds</th>
                        <th scope="col" className="py-1.5 pl-2 text-right">Routed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.activity.map((a) => (
                        <tr key={a.name} className="border-b border-slate-100">
                          <td className="py-1.5 pr-2 font-bold">{a.name}</td>
                          <td className="py-1.5 px-2 text-right">{a.patientsRegistered}</td>
                          <td className="py-1.5 px-2 text-right">{a.vitalsRecorded}</td>
                          <td className="py-1.5 px-2 text-right">{a.consultations}</td>
                          <td className="py-1.5 px-2 text-right">{a.labResults}</td>
                          <td className="py-1.5 px-2 text-right">{a.imagingReports}</td>
                          <td className="py-1.5 px-2 text-right">{a.medicationsGiven}</td>
                          <td className="py-1.5 pl-2 text-right">{a.patientsRouted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Download the data">
              <p className="text-sm text-slate-600 mb-3">
                CSV files open in Excel and can be loaded into SPSS or Python. They follow the class session chosen above.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {EXPORTS.map((e) => (
                  <a
                    key={e.table}
                    href={`/api/reports/export?table=${e.table}&session=${encodeURIComponent(scope)}`}
                    className="flex items-center justify-between gap-2 p-3 border border-slate-300 hover:border-brand hover:bg-amber-50"
                  >
                    <span>
                      <span className="block text-sm font-bold text-navy-dark">{e.label}</span>
                      <span className="block text-xs text-slate-500">{e.hint}</span>
                    </span>
                    <Download aria-hidden="true" className="w-4 h-4 text-navy shrink-0" />
                  </a>
                ))}
                <a
                  href={`/api/reports/export?table=backup&session=${encodeURIComponent(scope)}`}
                  className="flex items-center justify-between gap-2 p-3 border-2 border-navy hover:bg-amber-50"
                >
                  <span>
                    <span className="block text-sm font-bold text-navy-dark">Full backup (JSON)</span>
                    <span className="block text-xs text-slate-500">Everything, for safekeeping</span>
                  </span>
                  <Download aria-hidden="true" className="w-4 h-4 text-navy shrink-0" />
                </a>
              </div>
            </Card>

            <Card title={`Patient list (${data.patients.length})`}>
              {data.patients.length === 0 ? (
                <p className="text-sm text-slate-500">No patients in this session yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[44rem]">
                    <thead>
                      <tr className="text-left text-[11px] uppercase font-mono text-slate-600 border-b border-slate-200">
                        <th scope="col" className="py-1.5 pr-2">Record no.</th>
                        <th scope="col" className="py-1.5 pr-2">Name</th>
                        <th scope="col" className="py-1.5 pr-2">Age / sex</th>
                        <th scope="col" className="py-1.5 pr-2">Station</th>
                        <th scope="col" className="py-1.5 pr-2">Status</th>
                        <th scope="col" className="py-1.5 pr-2">Registered by</th>
                        <th scope="col" className="py-1.5">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.patients.map((p) => (
                        <tr key={`${p.hospitalNumber}-${p.registeredAt}`} className="border-b border-slate-100">
                          <td className="py-1.5 pr-2 font-mono font-bold">{p.hospitalNumber}</td>
                          <td className="py-1.5 pr-2">{p.fullName}</td>
                          <td className="py-1.5 pr-2">
                            {p.age} / {p.gender}
                          </td>
                          <td className="py-1.5 pr-2">{p.currentDepartment}</td>
                          <td className="py-1.5 pr-2">{p.status}</td>
                          <td className="py-1.5 pr-2">{p.registeredBy}</td>
                          <td className="py-1.5">{fmt(p.registeredAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
