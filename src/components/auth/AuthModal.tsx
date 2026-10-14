"use client";

import React, { useState } from "react";
import { useAuth, DEFAULT_STUDENT_ACCOUNTS } from "@/context/AuthContext";
import { useEMR } from "@/context/EMRContext";
import { RoleId, HOSPITAL_ROLES } from "@/types/emr";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { LogIn, UserPlus, X, Check, ShieldAlert, KeyRound } from "lucide-react";

function AuthModalInner() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authMode,
    setAuthMode,
    login,
    signup,
  } = useAuth();

  const { setActiveRole, setActiveStaffName } = useEMR();
  const dialogRef = useDialogA11y<HTMLDivElement>(() => setAuthModalOpen(false));

  // Sign In State
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign Up State
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [role, setRole] = useState<RoleId>("triage_nurse");
  const [signupPassword, setSignupPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    const res = await login(loginId, loginPassword);
    setSubmitting(false);

    if (res.success) {
      // Find logged in account to sync EMR context
      const account = DEFAULT_STUDENT_ACCOUNTS.find(
        (a) => a.studentId.toUpperCase() === loginId.trim().toUpperCase()
      );
      if (account) {
        setActiveRole(account.assignedRole);
        setActiveStaffName(`${account.fullName} (${account.studentId})`);
      }
      setLoginId("");
      setLoginPassword("");
    } else {
      setErrorMessage(res.error || "Authentication failed.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    const res = await signup(fullName, studentId, role, signupPassword);
    setSubmitting(false);

    if (res.success) {
      setActiveRole(role);
      setActiveStaffName(`${fullName.trim()} (${studentId.trim().toUpperCase()})`);
      setFullName("");
      setStudentId("");
      setSignupPassword("");
    } else {
      setErrorMessage(res.error || "Registration failed.");
    }
  };

  const handleQuickLogin = async (account: (typeof DEFAULT_STUDENT_ACCOUNTS)[0]) => {
    setSubmitting(true);
    await login(account.studentId, account.password);
    setActiveRole(account.assignedRole);
    setActiveStaffName(`${account.fullName} (${account.studentId})`);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/45 backdrop-blur-[1px] p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        tabIndex={-1}
        className="bg-white border border-charcoal max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-xl outline-none"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-cream-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sage" />
              <h3 id="auth-dialog-title" className="font-serif text-lg font-bold text-charcoal">
                Trinity Point Hospital — Student Portal
              </h3>
            </div>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Sign in or register to record clinical observations under your student ID
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close sign in dialog"
            className="text-charcoal-muted hover:text-charcoal p-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 border border-cream-border p-1 bg-cream-warm text-xs font-mono">
          <button
            type="button"
            aria-pressed={authMode === "signin"}
            onClick={() => {
              setAuthMode("signin");
              setErrorMessage("");
            }}
            className={`py-2 text-center transition-colors ${
              authMode === "signin"
                ? "bg-white text-charcoal font-bold border border-cream-border shadow-sm"
                : "text-charcoal-muted hover:text-charcoal"
            }`}
          >
            Sign In (Existing Student)
          </button>
          <button
            type="button"
            aria-pressed={authMode === "signup"}
            onClick={() => {
              setAuthMode("signup");
              setErrorMessage("");
            }}
            className={`py-2 text-center transition-colors ${
              authMode === "signup"
                ? "bg-white text-charcoal font-bold border border-cream-border shadow-sm"
                : "text-charcoal-muted hover:text-charcoal"
            }`}
          >
            Sign Up (Register Student)
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div role="alert" className="p-3 bg-terracotta-light border border-terracotta-border text-terracotta text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {authMode === "signin" ? (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase text-charcoal-muted mb-1">
                  Matric / Student ID *
                </label>
                <input
                  required
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. NUR-001 or NUR/2024/042"
                  className="w-full p-2.5 bg-cream-warm border border-cream-border focus:border-sage text-charcoal font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-charcoal-muted mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password or passkey"
                  className="w-full p-2.5 bg-cream-warm border border-cream-border focus:border-sage text-charcoal font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-charcoal hover:bg-charcoal/90 text-cream text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-sage-light" />
              <span>{submitting ? "Signing In..." : "Sign In to Hospital Session"}</span>
            </button>

            {/* Quick 1-Click Test Accounts */}
            <div className="pt-3 border-t border-cream-border space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal-muted block">
                Quick 1-Click Simulation Logins:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {DEFAULT_STUDENT_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    className="p-1.5 text-left border border-cream-border hover:border-charcoal bg-cream/70 text-[10px] flex flex-col"
                  >
                    <span className="font-serif font-bold text-charcoal truncate">
                      {acc.fullName}
                    </span>
                    <span className="font-mono text-charcoal-subtle">
                      {acc.studentId} ({acc.assignedRole.slice(0, 3).toUpperCase()})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignup} className="space-y-4 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase text-charcoal-muted mb-1">
                  Full Student Name *
                </label>
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Adaeze Nwafor"
                  className="w-full p-2.5 bg-cream-warm border border-cream-border focus:border-sage text-charcoal font-sans"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-charcoal-muted mb-1">
                  Student / Matriculation Number *
                </label>
                <input
                  required
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. NUR/2024/098"
                  className="w-full p-2.5 bg-cream-warm border border-cream-border focus:border-sage text-charcoal font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-charcoal-muted mb-1">
                  Assigned Clinical Station Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as RoleId)}
                  className="w-full p-2.5 bg-cream-warm border border-cream-border focus:border-sage text-charcoal font-sans"
                >
                  {HOSPITAL_ROLES.filter((r) => r.id !== "director").map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.badge}) — {r.cadre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-charcoal-muted mb-1">
                  Create Password / PIN
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Optional PIN or password (default: pass)"
                  className="w-full p-2.5 bg-cream-warm border border-cream-border focus:border-sage text-charcoal font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-sage hover:bg-sage-hover text-cream text-xs font-semibold flex items-center justify-center gap-2 border border-sage transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{submitting ? "Registering..." : "Register & Enter Hospital Station"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function AuthModal() {
  const { authModalOpen } = useAuth();
  if (!authModalOpen) return null;
  return <AuthModalInner />;
}
