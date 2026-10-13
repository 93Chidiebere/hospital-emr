"use client";

import React, { useState } from "react";
import { useEMR } from "@/context/EMRContext";
import { useAuth } from "@/context/AuthContext";
import { HOSPITAL_ROLES } from "@/types/emr";
import {
  UserCheck,
  RotateCcw,
  Plus,
  Clock,
  ChevronDown,
  ShieldAlert,
  LogIn,
  LogOut,
  User,
} from "lucide-react";

interface NavbarProps {
  onOpenIntake: () => void;
}

export function Navbar({ onOpenIntake }: NavbarProps) {
  const {
    activeRole,
    setActiveRole,
    activeStaffName,
    setActiveStaffName,
    resetToDemoCases,
    patients,
  } = useEMR();

  const { currentUser, setAuthModalOpen, setAuthMode, logout } = useAuth();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const currentRoleMeta = HOSPITAL_ROLES.find((r) => r.id === activeRole) || HOSPITAL_ROLES[0];
  const activeCount = patients.filter((p) => p.status === "Active").length;

  return (
    <header className="bg-cream border-b border-cream-border sticky top-0 z-30">
      {/* Topmast Institution Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 border-b border-cream-border/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-charcoal text-cream flex items-center justify-center font-serif text-lg font-bold border border-charcoal">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-charcoal">
                Trinity Point Hospital
              </span>
            </div>
            <p className="text-[11px] text-charcoal-muted tracking-wide font-sans">
              Clinical/Hospital Data Flow
            </p>
          </div>
        </div>

        {/* Global Classroom Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs text-charcoal-muted border-r border-cream-border pr-3">
            <Clock className="w-3.5 h-3.5 text-sage" />
            <span className="font-mono">
              Live Registry: <strong className="text-charcoal font-semibold">{activeCount}</strong> In-Clinic
            </span>
          </div>

          {/* Student Auth Button / Profile Badge */}
          {currentUser ? (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-cream-warm border border-cream-border text-xs">
              <User className="w-3.5 h-3.5 text-sage" />
              <div className="text-left font-sans">
                <span className="font-serif font-bold text-charcoal text-xs block leading-tight">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] text-charcoal-muted font-mono">
                  {currentUser.studentId}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign out of student account"
                className="ml-2 text-charcoal-muted hover:text-terracotta transition-colors p-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthMode("signin");
                setAuthModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-charcoal bg-white hover:bg-cream-warm border border-cream-border transition-colors font-mono"
            >
              <LogIn className="w-3.5 h-3.5 text-sage" />
              <span>Student Sign In / Sign Up</span>
            </button>
          )}

          <button
            onClick={() => setResetConfirmOpen(true)}
            title="Reset to 5 pre-configured student clinical cases"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-charcoal-muted hover:text-charcoal bg-cream hover:bg-cream-warm border border-cream-border transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Drill Data</span>
          </button>

          <button
            onClick={onOpenIntake}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cream bg-sage hover:bg-sage-hover transition-colors border border-sage"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enroll New Patient</span>
          </button>
        </div>
      </div>

      {/* Role Selection & Identity Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs bg-cream-warm/40">
        <div className="flex items-center gap-3">
          <span className="text-charcoal-muted font-sans uppercase tracking-wider text-[11px] flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-sage" />
            Active Classroom Role:
          </span>

          {/* Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1 bg-white border border-cream-border text-charcoal hover:border-charcoal transition-colors font-medium text-xs"
            >
              <span className="font-mono px-1 py-0.2 bg-sage-light text-sage border border-sage-border text-[10px]">
                {currentRoleMeta.badge}
              </span>
              <span className="font-serif text-sm font-semibold">{currentRoleMeta.title}</span>
              <ChevronDown className="w-3.5 h-3.5 text-charcoal-muted ml-1" />
            </button>

            {roleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRoleDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-1 w-80 bg-white border border-charcoal shadow-sm z-50 divide-y divide-cream-border">
                  <div className="px-3 py-2 bg-cream-warm text-[11px] text-charcoal-muted uppercase font-mono tracking-wider">
                    Select Your Simulated Department Post:
                  </div>
                  {HOSPITAL_ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setActiveRole(r.id);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 hover:bg-cream-warm transition-colors flex items-start gap-2.5 ${
                        activeRole === r.id ? "bg-sage-light/60 font-medium" : ""
                      }`}
                    >
                      <span className="font-mono px-1.5 py-0.5 bg-cream border border-cream-border text-[10px] text-charcoal mt-0.5">
                        {r.badge}
                      </span>
                      <div className="flex-1">
                        <div className="font-serif text-xs font-bold text-charcoal flex items-center justify-between">
                          <span>{r.title}</span>
                          <span className="text-[10px] font-sans text-charcoal-subtle font-normal">
                            {r.cadre}
                          </span>
                        </div>
                        <p className="text-[11px] text-charcoal-muted mt-0.5 line-clamp-1">
                          {r.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Staff Sign-off Identity Field */}
        <div className="flex items-center gap-2">
          <span className="text-charcoal-subtle text-[11px]">Signing off as:</span>
          <input
            type="text"
            value={activeStaffName}
            onChange={(e) => setActiveStaffName(e.target.value)}
            title="Type student name or ID for clinical log entries"
            className="px-2 py-0.5 text-xs bg-white border border-cream-border focus:border-sage text-charcoal w-48 sm:w-64 font-sans"
            placeholder="Student Name / Staff ID"
          />
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 backdrop-blur-[1px] p-4">
          <div className="bg-white border border-charcoal max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-terracotta">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-serif text-lg font-bold text-charcoal">
                Reset Simulated Drill Data?
              </h3>
            </div>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              This will restore the patient registry back to the original 5 clinical cases
              (including acute malaria in treatment, follow-up lab review, hypertensive urgency,
              and pediatric cases). Any new entries created during this session will be replaced.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-cream-border">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-3 py-1.5 text-xs border border-cream-border text-charcoal hover:bg-cream-warm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await resetToDemoCases();
                  setResetConfirmOpen(false);
                }}
                className="px-4 py-1.5 text-xs bg-charcoal text-cream hover:bg-charcoal/90"
              >
                Yes, Restore Demo Cases
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
