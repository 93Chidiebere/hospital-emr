"use client";

import React, { useState } from "react";
import { useAuth, DEFAULT_STUDENT_ACCOUNTS } from "@/context/AuthContext";
import { RoleId, HOSPITAL_ROLES } from "@/types/emr";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { LogIn, UserPlus, X, ShieldAlert } from "lucide-react";

function AuthModalInner() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authMode,
    setAuthMode,
    login,
    signup,
  } = useAuth();

  const dialogRef = useDialogA11y<HTMLDivElement>(() => setAuthModalOpen(false));

  // Sign In State
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign Up State
  const [fullName, setFullName] = useState("");
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

    const res = await signup(fullName, role, signupPassword);
    setSubmitting(false);

    if (res.success) {
      setFullName("");
      setSignupPassword("");
    } else {
      setErrorMessage(res.error || "Registration failed.");
    }
  };

  const handleQuickLogin = async (account: (typeof DEFAULT_STUDENT_ACCOUNTS)[0]) => {
    setSubmitting(true);
    await login(account.fullName, account.password);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-[2px] p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        tabIndex={-1}
        className="bg-white border border-brand max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl outline-none rounded-[2px]"
      >
        {/* Campus Gate Banner with Trinity Logo */}
        <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-brand">
          <img
            src="/trinity-campus.png"
            alt="Trinity University Campus Gate"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 flex items-end p-4">
            <div className="flex items-center gap-3">
              <img
                src="/trinity-logo.png"
                alt="Trinity University Emblem"
                className="h-10 w-10 bg-white/95 p-0.5 rounded-[2px] object-contain shadow-md shrink-0"
              />
              <div className="min-w-0">
                <h3 id="auth-dialog-title" className="font-serif text-base sm:text-lg font-bold text-white leading-tight">
                  Trinity University Hospital EHR
                </h3>
                <p className="text-[11px] text-white/80 font-sans tracking-wide">
                  Clinical Simulation Portal &bull; Staff Authentication
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            aria-label="Close authentication dialog"
            className="absolute top-2.5 right-2.5 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 p-1.5 rounded-[2px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Tab Selection */}
          <div className="grid grid-cols-2 border border-paper-border p-1 bg-paper-warm text-xs font-mono">
            <button
              type="button"
              aria-pressed={authMode === "signin"}
              onClick={() => {
                setAuthMode("signin");
                setErrorMessage("");
              }}
              className={`py-2 text-center transition-colors ${
                authMode === "signin"
                  ? "bg-white text-charcoal font-bold border border-paper-border shadow-sm"
                  : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              Sign In (Existing Account)
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
                  ? "bg-white text-charcoal font-bold border border-paper-border shadow-sm"
                  : "text-charcoal-muted hover:text-charcoal"
              }`}
            >
              Sign Up (New Account)
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
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="e.g. Nurse Mary Okon"
                    className="w-full p-2.5 bg-paper-warm border border-paper-border focus:border-brand text-charcoal font-mono"
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
                    className="w-full p-2.5 bg-paper-warm border border-paper-border focus:border-brand text-charcoal font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-brand hover:bg-brand-hover text-paper text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-brand-light" />
                <span>{submitting ? "Signing In..." : "Sign In to Hospital Session"}</span>
              </button>

              {/* Quick 1-Click Test Accounts */}
              <div className="pt-3 border-t border-paper-border space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal-muted block">
                  Quick 1-Click Simulation Logins:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {DEFAULT_STUDENT_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickLogin(acc)}
                      className="p-1.5 text-left border border-paper-border hover:border-brand bg-paper/70 text-[10px] flex flex-col"
                    >
                      <span className="font-serif font-bold text-charcoal truncate">
                        {acc.fullName}
                      </span>
                      <span className="font-mono text-charcoal-subtle">
                        {HOSPITAL_ROLES.find((r) => r.id === acc.assignedRole)?.badge}
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
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Adaeze Nwafor"
                    className="w-full p-2.5 bg-paper-warm border border-paper-border focus:border-brand text-charcoal font-sans"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-charcoal-muted mb-1">
                    Assigned Clinical Station Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as RoleId)}
                    className="w-full p-2.5 bg-paper-warm border border-paper-border focus:border-brand text-charcoal font-sans"
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
                    className="w-full p-2.5 bg-paper-warm border border-paper-border focus:border-brand text-charcoal font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-brand hover:bg-brand-hover text-paper text-xs font-semibold flex items-center justify-center gap-2 border border-brand transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{submitting ? "Registering..." : "Register & Enter Hospital Station"}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function AuthModal() {
  const { authModalOpen } = useAuth();
  if (!authModalOpen) return null;
  return <AuthModalInner />;
}
