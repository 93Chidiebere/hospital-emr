"use client";

import React, { useState } from "react";
import { useEMR } from "@/context/EMRContext";
import { Patient, Department, DEPARTMENTS_METADATA } from "@/types/emr";
import { Search, ArrowRightLeft, FileSpreadsheet, AlertTriangle } from "lucide-react";

interface MasterDirectoryWorkstationProps {
  onOpenDossier: (patient: Patient) => void;
  onOpenTransfer: (patient: Patient) => void;
}

export function MasterDirectoryWorkstation({
  onOpenDossier,
  onOpenTransfer,
}: MasterDirectoryWorkstationProps) {
  const { patients, filterDepartment, setFilterDepartment } = useEMR();
  const [query, setQuery] = useState("");

  const filtered = patients.filter((p) => {
    const matchesDept = filterDepartment === "ALL" || p.currentDepartment === filterDepartment;
    const matchesQuery =
      !query ||
      p.fullName.toLowerCase().includes(query.toLowerCase()) ||
      p.hospitalNumber.toLowerCase().includes(query.toLowerCase()) ||
      p.currentDepartment.toLowerCase().includes(query.toLowerCase());
    return matchesDept && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-cream-border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sage" />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-charcoal">
              Trinity Point Hospital — Master Clinical Directory
            </h2>
          </div>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Hospital-wide centralized registry of all patient charts, clinical movement pipelines, and active queues.
          </p>
        </div>

        <div className="text-xs font-mono text-charcoal-muted">
          Total Registered Cases: <strong>{patients.length}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-cream-border p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by patient name, hospital number, or condition..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-cream-warm border border-cream-border focus:border-sage text-charcoal font-sans"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-charcoal-muted uppercase mr-1">
            Station Filter:
          </span>
          <button
            onClick={() => setFilterDepartment("ALL")}
            className={`px-2 py-1 text-xs font-mono border ${
              filterDepartment === "ALL"
                ? "bg-charcoal text-cream border-charcoal font-bold"
                : "bg-cream-warm text-charcoal-muted border-cream-border hover:border-charcoal"
            }`}
          >
            All ({patients.length})
          </button>
          {Object.entries(DEPARTMENTS_METADATA).map(([key, meta]) => {
            const count = patients.filter((p) => p.currentDepartment === key).length;
            const isSelected = filterDepartment === key;
            return (
              <button
                key={key}
                onClick={() => setFilterDepartment(key as Department)}
                className={`px-2 py-1 text-xs font-mono border ${
                  isSelected
                    ? "bg-sage text-cream border-sage font-bold"
                    : "bg-cream-warm text-charcoal-muted border-cream-border hover:border-charcoal"
                }`}
              >
                {meta.code} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Master Table */}
      <div className="bg-white border border-cream-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cream-warm border-b border-cream-border text-charcoal font-mono uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Hospital Record No.</th>
                <th className="p-3.5">Patient Details</th>
                <th className="p-3.5">Current Station</th>
                <th className="p-3.5">Latest Vitals</th>
                <th className="p-3.5">Pending Orders</th>
                <th className="p-3.5">Current Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-muted">
                    No patient records found matching the current station or search query.
                  </td>
                </tr>
              ) : (
                filtered.map((pat) => {
                  const deptMeta = DEPARTMENTS_METADATA[pat.currentDepartment];
                  const vit = pat.vitalsHistory[0];
                  const pendingLabs = pat.labOrders.filter((l) => l.status !== "completed").length;
                  const pendingMeds = pat.medications.filter((m) => m.status !== "administered").length;

                  return (
                    <tr
                      key={pat.id}
                      className="hover:bg-cream/40 transition-colors cursor-pointer"
                      onClick={() => onOpenDossier(pat)}
                    >
                      <td className="p-3.5 font-mono font-bold text-charcoal">
                        {pat.hospitalNumber}
                      </td>

                      <td className="p-3.5">
                        <div className="font-serif font-bold text-charcoal text-sm">
                          {pat.fullName}
                        </div>
                        <div className="text-[11px] text-charcoal-muted">
                          {pat.age}y &bull; {pat.gender} &bull; {pat.paymentType}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono text-xs px-2 py-0.5 bg-cream-warm border border-cream-border text-charcoal font-medium">
                          {deptMeta.name}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {vit ? (
                          <div className="font-mono text-[11px] space-y-0.5">
                            <div>BP: {vit.bloodPressureSystolic}/{vit.bloodPressureDiastolic} mmHg</div>
                            <div className={vit.temperature >= 38 ? "text-terracotta font-bold" : "text-charcoal-muted"}>
                              T: {vit.temperature}&deg;C &bull; SpO2: {vit.spO2}%
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-charcoal-subtle italic">No vitals</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-col gap-1 font-mono text-[10px]">
                          {pendingLabs > 0 && (
                            <span className="text-amber-alert font-bold">
                              &bull; {pendingLabs} Lab Test(s)
                            </span>
                          )}
                          {pendingMeds > 0 && (
                            <span className="text-terracotta font-bold">
                              &bull; {pendingMeds} Injection(s)
                            </span>
                          )}
                          {pendingLabs === 0 && pendingMeds === 0 && (
                            <span className="text-charcoal-subtle">None pending</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-mono text-[10px] uppercase px-2 py-0.5 border ${
                            pat.status === "Discharged"
                              ? "bg-cream-warm text-charcoal-muted border-cream-border"
                              : "bg-sage-light text-sage border-sage-border font-bold"
                          }`}
                        >
                          {pat.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onOpenTransfer(pat)}
                            className="px-2.5 py-1 text-xs bg-charcoal hover:bg-charcoal/90 text-cream flex items-center gap-1 font-mono"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-sage-light" />
                            <span>Route</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenDossier(pat)}
                            className="px-2.5 py-1 text-xs border border-cream-border hover:border-charcoal bg-white font-mono"
                          >
                            Chart
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
