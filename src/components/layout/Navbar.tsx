"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useEMR } from "@/context/EMRContext";
import { useAuth } from "@/context/AuthContext";
import { HOSPITAL_ROLES, RoleId } from "@/types/emr";
import { canSwitchRole } from "@/lib/role-access";
import { useDialogA11y } from "@/hooks/useDialogA11y";
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
  Lock,
} from "lucide-react";

interface NavbarProps {
  onOpenIntake: () => void;
}

/* ------------------------------------------------------------------ */
/* Role menu (only rendered for guests and instructors)                */
/* ------------------------------------------------------------------ */
function RoleMenu({
  activeRole,
  onSelect,
}: {
  activeRole: RoleId;
  onSelect: (id: RoleId) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  const current = HOSPITAL_ROLES.find((r) => r.id === activeRole) || HOSPITAL_ROLES[0];

  const closeAndReturnFocus = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  // Focus the active item when opening; close on outside pointer press
  useEffect(() => {
    if (!open) return;

    const activeIndex = Math.max(
      0,
      HOSPITAL_ROLES.findIndex((r) => r.id === activeRole)
    );
    itemRefs.current[activeIndex]?.focus();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open, activeRole]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLButtonElement);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        items[(index + 1) % items.length].focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        items[(index - 1 + items.length) % items.length].focus();
        break;
      case "Home":
        e.preventDefault();
        items[0].focus();
        break;
      case "End":
        e.preventDefault();
        items[items.length - 1].focus();
        break;
      case "Escape":
        e.preventDefault();
        closeAndReturnFocus();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex items-center gap-2 px-3 py-1.5 min-h-[44px] sm:min-h-0 bg-white border border-paper-border text-charcoal hover:border-brand transition-colors font-medium text-xs"
      >
        <span className="font-mono px-1 bg-brand-light text-brand border border-brand-border text-[10px]">
          {current.badge}
        </span>
        <span className="font-serif text-sm font-semibold text-left">{current.title}</span>
        <ChevronDown
          aria-hidden="true"
          className={`w-3.5 h-3.5 text-charcoal-muted ml-1 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Select your simulated department post"
          onKeyDown={handleMenuKeyDown}
          className="absolute left-0 mt-1 w-[min(20rem,calc(100vw-2rem))] max-h-[70vh] overflow-y-auto bg-white border border-brand shadow-sm z-50 divide-y divide-paper-border"
        >
          <div
            aria-hidden="true"
            className="px-3 py-2 bg-paper-warm text-[11px] text-charcoal-muted uppercase font-mono tracking-wider"
          >
            Select Your Simulated Department Post:
          </div>
          {HOSPITAL_ROLES.map((r, i) => {
            const selected = activeRole === r.id;
            return (
              <button
                key={r.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                tabIndex={-1}
                onClick={() => {
                  onSelect(r.id);
                  closeAndReturnFocus();
                }}
                className={`w-full text-left px-3 py-3 sm:py-2.5 hover:bg-paper-warm focus:bg-paper-warm transition-colors flex items-start gap-2.5 ${
                  selected ? "bg-brand-light/60 font-medium" : ""
                }`}
              >
                <span className="font-mono px-1.5 py-0.5 bg-paper border border-paper-border text-[10px] text-charcoal mt-0.5">
                  {r.badge}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="font-serif text-xs font-bold text-charcoal flex flex-wrap items-center justify-between gap-x-2">
                    <span>{r.title}</span>
                    <span className="text-[10px] font-sans text-charcoal-muted font-normal">
                      {r.cadre}
                    </span>
                  </span>
                  <span className="block text-[11px] text-charcoal-muted mt-0.5 line-clamp-2">
                    {r.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reset confirmation dialog                                           */
/* ------------------------------------------------------------------ */
function ResetConfirmDialog({
  onCancel,
  onConfirm,
  live,
}: {
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  live: boolean;
}) {
  const dialogRef = useDialogA11y<HTMLDivElement>(onCancel);
  const titleId = useId();
  const descId = useId();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 backdrop-blur-[1px] p-4">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="bg-white border border-brand max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 outline-none"
      >
        <div className="flex items-center gap-2 text-terracotta">
          <ShieldAlert aria-hidden="true" className="w-5 h-5 shrink-0" />
          <h2 id={titleId} className="font-serif text-lg font-bold text-charcoal">
            {live ? "Clear all class records?" : "Reset Simulated Drill Data?"}
          </h2>
        </div>
        <p id={descId} className="text-xs text-charcoal-muted leading-relaxed">
          {live
            ? "This permanently deletes every patient record created by all students and restarts hospital numbers at 1. All counts return to zero. This cannot be undone."
            : "This will restore the demo registry back to the original 5 sample cases. Any entries you added in this browser will be replaced. (Demo data is never shared and is not the class record.)"}
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-paper-border">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="px-3 py-2.5 sm:py-1.5 text-xs border border-paper-border text-charcoal hover:bg-paper-warm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2.5 sm:py-1.5 text-xs bg-brand text-paper hover:bg-brand-hover"
          >
            Yes, Restore Demo Cases
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Navbar                                                              */
/* ------------------------------------------------------------------ */
export function Navbar({ onOpenIntake }: NavbarProps) {
  const {
    activeRole,
    setActiveRole,
    activeStaffName,
    setActiveStaffName,
    resetToDemoCases,
    patients,
    isLive,
  } = useEMR();

  const { currentUser, setAuthModalOpen, setAuthMode, logout } = useAuth();

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const signOffId = useId();

  const roleSwitchAllowed = canSwitchRole(currentUser);
  const currentRoleMeta = HOSPITAL_ROLES.find((r) => r.id === activeRole) || HOSPITAL_ROLES[0];
  const activeCount = patients.filter((p) => p.status === "Active").length;
  // Live class records can only be cleared by the instructor account
  const canReset = !isLive || currentUser?.assignedRole === "director";

  return (
    <>
      <header className="bg-paper border-b border-paper-border md:sticky md:top-0 md:z-30">
        {/* Topmast Institution Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-paper-border/60">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/trinity-logo.png"
              alt="Trinity University"
              className="h-10 sm:h-12 w-auto object-contain shrink-0 rounded-[2px]"
            />
            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-charcoal leading-tight">
                Trinity University Hospital EHR
              </h1>
              <p className="text-[11px] text-charcoal-muted tracking-wide font-sans">
                Clinical/Hospital Data Flow
              </p>
            </div>
          </div>

          {/* Global Classroom Status & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div
              role="status"
              className="hidden sm:flex items-center gap-2 text-xs text-charcoal-muted md:border-r border-paper-border md:pr-3"
            >
              <Clock aria-hidden="true" className="w-3.5 h-3.5 text-brand" />
              <span
                className={`font-mono px-1.5 py-0.5 border text-[10px] uppercase mr-1 ${
                  isLive
                    ? "bg-brand text-paper border-brand"
                    : "bg-paper-warm text-charcoal border-paper-border"
                }`}
              >
                {isLive ? "Live records" : "Demo data"}
              </span>
              <span className="font-mono">
                Live Registry:{" "}
                <strong className="text-charcoal font-semibold">{activeCount}</strong> In-Clinic
              </span>
            </div>

            {/* Student Auth Button / Profile Badge */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2.5 pr-1 py-1 bg-paper-warm border border-paper-border text-xs max-w-full">
                <User aria-hidden="true" className="w-3.5 h-3.5 text-brand shrink-0" />
                <div className="text-left font-sans min-w-0">
                  <span className="font-serif font-bold text-charcoal text-xs block leading-tight truncate max-w-[10rem] sm:max-w-[14rem]">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-charcoal-muted font-mono">
                    {HOSPITAL_ROLES.find((r) => r.id === currentUser.assignedRole)?.badge}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  aria-label={`Sign out ${currentUser.fullName}`}
                  title="Sign out of student account"
                  className="ml-1 text-charcoal-muted hover:text-terracotta transition-colors p-2.5 sm:p-1.5"
                >
                  <LogOut aria-hidden="true" className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] sm:min-h-0 sm:px-2.5 sm:py-1.5 text-xs text-charcoal bg-white hover:bg-paper-warm border border-paper-border transition-colors font-mono"
              >
                <LogIn aria-hidden="true" className="w-3.5 h-3.5 text-brand" />
                <span className="sm:hidden">Sign In</span>
                <span className="hidden sm:inline">Student Sign In / Sign Up</span>
              </button>
            )}

            {canReset && (
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              title={isLive ? "Delete all class records and restart numbering at 1" : "Reset to the 5 sample demo cases"}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] sm:min-h-0 sm:px-2.5 sm:py-1.5 text-xs text-charcoal-muted hover:text-charcoal bg-paper hover:bg-paper-warm border border-paper-border transition-colors"
            >
              <RotateCcw aria-hidden="true" className="w-3.5 h-3.5" />
              <span className="sm:hidden">{isLive ? "Clear" : "Reset"}</span>
              <span className="hidden sm:inline">{isLive ? "Clear Class Records" : "Reset Drill Data"}</span>
            </button>
            )}

            <button
              type="button"
              onClick={onOpenIntake}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 text-xs font-medium text-paper bg-brand hover:bg-brand-hover transition-colors border border-brand"
            >
              <Plus aria-hidden="true" className="w-3.5 h-3.5" />
              <span className="sm:hidden">Enroll</span>
              <span className="hidden sm:inline">Enroll New Patient</span>
            </button>
          </div>
        </div>

        {/* Role Selection & Identity Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-xs bg-paper-warm/40">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="text-charcoal-muted font-sans uppercase tracking-wider text-[11px] flex items-center gap-1">
              <UserCheck aria-hidden="true" className="w-3.5 h-3.5 text-brand" />
              {roleSwitchAllowed ? "Active Classroom Role:" : "Your Assigned Station:"}
            </span>

            {roleSwitchAllowed ? (
              <RoleMenu activeRole={activeRole} onSelect={setActiveRole} />
            ) : (
              <div
                title="Your station is fixed by the role you registered with. Sign out to use a different account."
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-paper-border text-charcoal text-xs w-fit max-w-full"
              >
                <Lock aria-hidden="true" className="w-3.5 h-3.5 text-charcoal-muted shrink-0" />
                <span className="font-mono px-1 bg-brand-light text-brand border border-brand-border text-[10px]">
                  {currentRoleMeta.badge}
                </span>
                <span className="font-serif text-sm font-semibold">{currentRoleMeta.title}</span>
                <span className="sr-only">
                  (locked to your registered role; sign out to use a different account)
                </span>
              </div>
            )}
          </div>

          {/* Staff Sign-off Identity Field */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <label htmlFor={signOffId} className="text-charcoal-muted text-[11px]">
              Signing off as:
            </label>
            <input
              id={signOffId}
              type="text"
              value={activeStaffName}
              readOnly={!!currentUser}
              onChange={(e) => setActiveStaffName(e.target.value)}
              title={
                currentUser
                  ? "Locked to your signed-in student account"
                  : "Type student name or ID for clinical log entries"
              }
              className="px-2 py-2 sm:py-0.5 text-xs bg-white border border-paper-border focus:border-brand text-charcoal w-full sm:w-64 font-sans read-only:bg-paper-warm read-only:text-charcoal-muted"
              placeholder="Student Name / Staff ID"
            />
          </div>
        </div>
      </header>

      {resetConfirmOpen && (
        <ResetConfirmDialog
          live={isLive}
          onCancel={() => setResetConfirmOpen(false)}
          onConfirm={async () => {
            await resetToDemoCases();
            setResetConfirmOpen(false);
          }}
        />
      )}
    </>
  );
}
