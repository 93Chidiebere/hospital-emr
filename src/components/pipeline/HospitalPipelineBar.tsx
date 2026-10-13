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
    <div className="bg-white border-b border-cream-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-charcoal-muted">
              Live Clinical Flow Pipeline:
            </span>
            <span className="text-[10px] text-charcoal-subtle italic">
              Click any station to view its active queue
            </span>
          </div>
          <button
            onClick={() => setFilterDepartment("ALL")}
            className={`px-2 py-0.5 text-xs font-mono transition-colors border ${
              filterDepartment === "ALL"
                ? "bg-charcoal text-cream border-charcoal font-semibold"
                : "bg-cream-warm text-charcoal-muted border-cream-border hover:border-charcoal hover:text-charcoal"
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
                onClick={() => setFilterDepartment(dept)}
                className={`p-2 text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? "bg-sage-light border-sage text-charcoal shadow-sm"
                    : "bg-cream/60 border-cream-border hover:bg-cream-warm hover:border-cream-border-dark text-charcoal-muted"
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isSelected ? "text-sage" : "text-charcoal-subtle"
                      }`}
                    />
                    <span className="text-[10px] font-mono uppercase tracking-wider">
                      {meta.code}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs px-1.5 py-0.2 ${
                      count > 0
                        ? isSelected
                          ? "bg-sage text-cream font-bold"
                          : "bg-charcoal text-cream font-medium"
                        : "bg-cream-warm text-charcoal-subtle border border-cream-border"
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
    </div>
  );
}
