"use client";

import React from "react";
import { useEMR } from "@/context/EMRContext";
import { Department, DEPARTMENTS_METADATA } from "@/types/emr";
import {
  FileText,
  Activity,
  Stethoscope,
  FlaskConical,
  Scan,
  Syringe,
  Bed,
  CheckCircle2,
} from "lucide-react";

const PIPELINE_ORDER: { dept: Department; icon: React.ElementType }[] = [
  { dept: "RECEPTION", icon: FileText },
  { dept: "TRIAGE", icon: Activity },
  { dept: "CONSULTATION", icon: Stethoscope },
  { dept: "LABORATORY", icon: FlaskConical },
  { dept: "RADIOLOGY", icon: Scan },
  { dept: "TREATMENT", icon: Syringe },
  { dept: "WARD", icon: Bed },
  { dept: "DISCHARGED", icon: CheckCircle2 },
];

export function HospitalPipelineBar() {
  const { patients, filterDepartment, setFilterDepartment } = useEMR();

  const getCount = (dept: Department) =>
    patients.filter((p) => p.currentDepartment === dept).length;

  return (
    <section aria-label="Live clinical flow pipeline" className="bg-[#071B33] border-b border-[#1E4E79] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-bold">
              Live Clinical Flow Pipeline:
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-300 italic">
              Click any station to filter its queue
            </span>
          </div>
          <button
            type="button"
            aria-pressed={filterDepartment === "ALL"}
            onClick={() => setFilterDepartment("ALL")}
            className={`px-3 py-1 text-xs font-mono transition-colors border ${
              filterDepartment === "ALL"
                ? "bg-brand text-navy-dark border-brand font-bold"
                : "bg-[#0F325E] text-slate-300 border-[#1E4E79] hover:border-brand hover:text-white"
            }`}
          >
            All Stations ({patients.length})
          </button>
        </div>

        {/* Horizontal Pipeline Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
          {PIPELINE_ORDER.map(({ dept, icon: Icon }) => {
            const count = getCount(dept);
            const isSelected = filterDepartment === dept;
            const meta = DEPARTMENTS_METADATA[dept];

            return (
              <button
                key={dept}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${meta.name}: ${count} ${count === 1 ? "patient" : "patients"}`}
                onClick={() => setFilterDepartment(dept)}
                className={`p-2.5 sm:p-2 min-h-[58px] text-left transition-all border flex flex-col justify-between rounded-[2px] ${
                  isSelected
                    ? "bg-[#0F325E] border-brand text-white shadow-md ring-1 ring-brand"
                    : "bg-[#0B2545] border-[#1E4E79] hover:bg-[#0F325E] text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      aria-hidden="true"
                      className={`w-3.5 h-3.5 ${
                        isSelected ? "text-brand" : "text-slate-400"
                      }`}
                    />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold">
                      {meta.code}
                    </span>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`font-mono text-xs px-1.5 py-0.5 rounded-[2px] ${
                      count > 0
                        ? "bg-brand text-navy-dark font-bold"
                        : "bg-[#071B33] text-slate-400 border border-[#1E4E79]"
                    }`}
                  >
                    {count}
                  </span>
                </div>
                <div className="mt-1.5">
                  <p className="font-sans text-xs font-bold leading-tight text-white line-clamp-1">
                    {meta.shortName}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
