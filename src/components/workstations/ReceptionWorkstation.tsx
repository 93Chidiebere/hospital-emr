"use client";

import React, { useState } from "react";
import { useEMR } from "@/context/EMRContext";
import { Patient, DEPARTMENTS_METADATA } from "@/types/emr";
import { FileText, UserPlus, ArrowRightLeft, Search, Clock } from "lucide-react";

interface ReceptionWorkstationProps {
  onOpenIntake: () => void;
  onOpenDossier: (patient: Patient) => void;
  onOpenTransfer: (patient: Patient) => void;
}

export function ReceptionWorkstation({
  onOpenIntake,
  onOpenDossier,
  onOpenTransfer,
}: ReceptionWorkstationProps) {
  const { patients } = useEMR();
  const [searchTerm, setSearchTerm] = useState("");

  const receptionPatients = patients.filter(
    (p) =>
      p.currentDepartment === "RECEPTION" ||
      (searchTerm &&
        (p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.hospitalNumber.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      {/* Station Title */}
      <div className="bg-white border border-cream-border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sage" />
            <h2 className="font-serif text-lg sm:text-xl font-bold text-charcoal">
              Front Desk & Medical Records Station
            </h2>
          </div>
          <p className="text-xs text-charcoal-muted mt-0.5">
            Register new patient charts, issue Trinity Point Hospital numbers, and route returning patients directly to any station.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenIntake}
            className="px-4 py-2 bg-sage hover:bg-sage-hover text-cream text-xs font-semibold flex items-center gap-1.5 border border-sage transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Enroll New Patient Chart</span>
          </button>
        </div>
      </div>

      {/* Returning Patient Search Bar */}
      <div className="bg-white border border-cream-border p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Lookup returning patient by name or Hospital ID (e.g. TPH-2026-00101)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-cream-warm border border-cream-border focus:border-sage text-charcoal font-sans"
          />
        </div>

        <div className="text-xs text-charcoal-muted font-mono">
          Showing <strong>{receptionPatients.length}</strong> patient docket(s)
        </div>
      </div>

      {/* Patient Dockets Table */}
      <div className="bg-white border border-cream-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cream-warm border-b border-cream-border text-charcoal font-mono uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Hospital Record No.</th>
                <th className="p-3.5">Patient Name & Demographics</th>
                <th className="p-3.5">Current Location</th>
                <th className="p-3.5">Billing Scheme</th>
                <th className="p-3.5">Last Hospital Event</th>
                <th className="p-3.5 text-right">Station Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {receptionPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-charcoal-muted">
                    No patients currently at Front Desk. Use the button above to enroll a new intake or search the hospital registry.
                  </td>
                </tr>
              ) : (
                receptionPatients.map((pat) => {
                  const deptMeta = DEPARTMENTS_METADATA[pat.currentDepartment];
                  const lastRoute = pat.routingHistory[pat.routingHistory.length - 1];

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
                          {pat.age} yrs &bull; {pat.gender} &bull; {pat.phoneNumber || "No phone"}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono text-xs px-2 py-0.5 bg-cream-warm border border-cream-border text-charcoal font-medium">
                          {deptMeta.shortName}
                        </span>
                      </td>

                      <td className="p-3.5 text-charcoal-muted font-sans">
                        {pat.paymentType}
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <p className="text-[11px] text-charcoal line-clamp-1">
                          {lastRoute?.reason || "Intake enrolled at Front Desk."}
                        </p>
                        <span className="text-[10px] text-charcoal-subtle font-mono">
                          {new Date(pat.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                            <span>Route / Move</span>
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
