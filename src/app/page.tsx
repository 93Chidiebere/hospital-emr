"use client";

import React, { useState, useEffect } from "react";
import { useEMR } from "@/context/EMRContext";
import { useAuth } from "@/context/AuthContext";
import { Patient, RoleId, HOSPITAL_ROLES } from "@/types/emr";
import { Navbar } from "@/components/layout/Navbar";
import { canSwitchRole } from "@/lib/role-access";
import { HospitalPipelineBar } from "@/components/pipeline/HospitalPipelineBar";
import { ReceptionWorkstation } from "@/components/workstations/ReceptionWorkstation";
import { TriageWorkstation } from "@/components/workstations/TriageWorkstation";
import { DoctorWorkstation } from "@/components/workstations/DoctorWorkstation";
import { LabWorkstation } from "@/components/workstations/LabWorkstation";
import { RadiologyWorkstation } from "@/components/workstations/RadiologyWorkstation";
import { TreatmentWorkstation } from "@/components/workstations/TreatmentWorkstation";
import { MasterDirectoryWorkstation } from "@/components/workstations/MasterDirectoryWorkstation";
import { NewPatientModal } from "@/components/intake/NewPatientModal";
import { PatientDossierModal } from "@/components/dossier/PatientDossierModal";
import { TransferModal } from "@/components/shared/TransferModal";
import { AuthModal } from "@/components/auth/AuthModal";
import {
  FileText,
  Activity,
  Stethoscope,
  FlaskConical,
  Scan,
  Syringe,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const { activeRole, setActiveRole, setActiveStaffName } = useEMR();
  const { currentUser } = useAuth();

  const [intakeOpen, setIntakeOpen] = useState(false);
  const [dossierPatient, setDossierPatient] = useState<Patient | null>(null);
  const [transferPatient, setTransferPatient] = useState<Patient | null>(null);

  // Sync role & staff name whenever student logs in
  useEffect(() => {
    if (currentUser) {
      setActiveRole(currentUser.assignedRole);
      setActiveStaffName(`${currentUser.fullName} (${currentUser.studentId})`);
    }
  }, [currentUser, setActiveRole, setActiveStaffName]);

  // Enforce role lock: students cannot leave the station they registered with
  useEffect(() => {
    if (currentUser && !canSwitchRole(currentUser) && activeRole !== currentUser.assignedRole) {
      setActiveRole(currentUser.assignedRole);
    }
  }, [currentUser, activeRole, setActiveRole]);

  const roleSwitchAllowed = canSwitchRole(currentUser);
  const activeRoleTitle = HOSPITAL_ROLES.find((r) => r.id === activeRole)?.title;

  return (
    <div className="min-h-screen flex flex-col bg-cream text-charcoal">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="sr-only" role="status" aria-live="polite">
        {activeRoleTitle ? `Active station: ${activeRoleTitle}` : ""}
      </div>

      {/* 1. Masthead Navbar */}
      <Navbar onOpenIntake={() => setIntakeOpen(true)} />

      {/* 2. Live Hospital Pipeline Bar */}
      <HospitalPipelineBar />

      {/* 3. Station Switcher Strip */}
      <div className="bg-cream-warm border-b border-cream-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal-muted">
              Active Station View:
            </span>
            <span className="font-serif font-bold text-charcoal text-sm">
              {activeRoleTitle}
            </span>
          </div>

          {/* Quick Station Tab Bar (guests and instructors only) */}
          {!roleSwitchAllowed && (
            <p className="text-[11px] text-charcoal-muted">
              Station locked to your registered role. Sign out to use a different account.
            </p>
          )}
          {roleSwitchAllowed && (
          <nav
            aria-label="Hospital stations"
            className="flex w-full md:w-auto min-w-0 items-center gap-1 overflow-x-auto py-1 snap-x"
          >
            {[
              { id: "receptionist" as RoleId, label: "Front Desk", icon: FileText },
              { id: "triage_nurse" as RoleId, label: "Triage Vitals", icon: Activity },
              { id: "doctor" as RoleId, label: "Doctor Consult", icon: Stethoscope },
              { id: "mls" as RoleId, label: "MLS Lab", icon: FlaskConical },
              { id: "radiographer" as RoleId, label: "Radiology", icon: Scan },
              { id: "treatment_nurse" as RoleId, label: "Treatment Room", icon: Syringe },
              { id: "director" as RoleId, label: "Master Registry", icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isCurrent = activeRole === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={isCurrent}
                  onClick={() => setActiveRole(tab.id)}
                  className={`px-3 py-2.5 sm:px-2.5 sm:py-1 shrink-0 snap-start flex items-center gap-1.5 transition-colors font-mono text-[11px] border whitespace-nowrap ${
                    isCurrent
                      ? "bg-charcoal text-cream border-charcoal font-bold"
                      : "bg-white text-charcoal-muted border-cream-border hover:bg-cream hover:border-charcoal hover:text-charcoal"
                  }`}
                >
                  <Icon aria-hidden="true" className={`w-3 h-3 ${isCurrent ? "text-sage-light" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
          )}
        </div>
      </div>

      {/* 4. Main Workstation Area */}
      <main id="main-content" tabIndex={-1} className="outline-none flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {activeRole === "receptionist" && (
          <ReceptionWorkstation
            onOpenIntake={() => setIntakeOpen(true)}
            onOpenDossier={(p) => setDossierPatient(p)}
            onOpenTransfer={(p) => setTransferPatient(p)}
          />
        )}

        {activeRole === "triage_nurse" && (
          <TriageWorkstation
            onOpenDossier={(p) => setDossierPatient(p)}
            onOpenTransfer={(p) => setTransferPatient(p)}
          />
        )}

        {activeRole === "doctor" && (
          <DoctorWorkstation
            onOpenDossier={(p) => setDossierPatient(p)}
            onOpenTransfer={(p) => setTransferPatient(p)}
          />
        )}

        {activeRole === "mls" && (
          <LabWorkstation
            onOpenDossier={(p) => setDossierPatient(p)}
            onOpenTransfer={(p) => setTransferPatient(p)}
          />
        )}

        {activeRole === "radiographer" && (
          <RadiologyWorkstation
            onOpenDossier={(p) => setDossierPatient(p)}
            onOpenTransfer={(p) => setTransferPatient(p)}
          />
        )}

        {activeRole === "treatment_nurse" && (
          <TreatmentWorkstation
            onOpenDossier={(p) => setDossierPatient(p)}
            onOpenTransfer={(p) => setTransferPatient(p)}
          />
        )}

        {activeRole === "director" && (
          <MasterDirectoryWorkstation
            onOpenDossier={(p) => setDossierPatient(p)}
            onOpenTransfer={(p) => setTransferPatient(p)}
          />
        )}
      </main>

      {/* 5. Editorial Footer */}
      <footer className="bg-white border-t border-cream-border py-6 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-serif font-bold text-charcoal text-sm">
              Trinity Point Hospital
            </p>
          </div>

          <ol
            aria-label="Patient journey"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-charcoal-subtle uppercase"
          >
            {["Intake", "Triage", "Consultation", "MLS Lab", "Treatment", "Discharge"].map(
              (step, i, arr) => (
                <li key={step} className="flex items-center gap-2">
                  <span>{step}</span>
                  {i < arr.length - 1 && (
                    <ArrowRight aria-hidden="true" className="w-2.5 h-2.5 text-sage" />
                  )}
                </li>
              )
            )}
          </ol>
        </div>
      </footer>

      {/* 6. Modals */}
      {intakeOpen && <NewPatientModal onClose={() => setIntakeOpen(false)} />}

      {dossierPatient && (
        <PatientDossierModal
          patient={dossierPatient}
          onClose={() => setDossierPatient(null)}
        />
      )}

      {transferPatient && (
        <TransferModal
          patient={transferPatient}
          onClose={() => setTransferPatient(null)}
        />
      )}

      <AuthModal />
    </div>
  );
}
