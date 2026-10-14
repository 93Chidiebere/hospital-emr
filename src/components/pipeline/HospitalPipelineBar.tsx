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
  Users,
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
    <section aria-label="Live clinical flow pipeline" className="bg-white border-b border-paper-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-charcoal-muted">
              Live Clinical Flow Pipeline:
            </span>
            <span className="hidden sm:inline text-[10px] text-charcoal-subtle italic">
              Click any station to view its active queue
            </span>
          </div>
          <button
            type="button"
            aria-pressed={filterDepartment === "ALL"}
            onClick={() => setFilterDepartment("ALL")}
            className={`px-3 py-2 sm:px-2 sm:py-0.5 text-xs font-mono transition-colors border ${
              filterDepartment === "ALL"
                ? "bg-brand text-paper border-brand font-semibold"
                : "bg-paper-warm text-charcoal-muted border-paper-border hover:border-brand hover:text-charcoal"
            }`}
          >
            All Stations ({patients.length})
          </button>
        </div>

        {/* Horizontal Editorial Pipeline Strip */}
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
                className={`p-2.5 sm:p-2 min-h-[56px] text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? "bg-brand-light border-brand text-charcoal shadow-sm"
                    : "bg-paper/60 border-paper-border hover:bg-paper-warm hover:border-paper-border-dark text-charcoal-muted"
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      aria-hidden="true"
                      className={`w-3.5 h-3.5 ${
                        isSelected ? "text-brand" : "text-charcoal-subtle"
                      }`}
                    />
                    <span className="text-[10px] font-mono uppercase tracking-wider">
                      {meta.code}
                    </span>
                  </div>
                  <span
                    aria-hidden="true"
                    className={`font-mono text-xs px-1.5 py-0.5 ${
                      count > 0
                        ? isSelected
                          ? "bg-brand text-paper font-bold"
                          : "bg-brand text-paper font-medium"
                        : "bg-paper-warm text-charcoal-subtle border border-paper-border"
                    }`}
                  >
                    {count}
                  </span>
                </div>
                <div className="mt-1.5">
                  <p className="font-serif text-xs font-semibold leading-tight text-charcoal line-clamp-1">
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
