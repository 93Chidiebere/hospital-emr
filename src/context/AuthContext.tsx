"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserAccount, RoleId } from "@/types/emr";

export const DEFAULT_STUDENT_ACCOUNTS: UserAccount[] = [
  {
    id: "usr-001",
    fullName: "Nurse Mary Okon",
    assignedRole: "triage_nurse",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "usr-002",
    fullName: "Dr. Kelechi Adeyemi",
    assignedRole: "doctor",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "usr-003",
    fullName: "MLS Emeka Chukwuma",
    assignedRole: "mls",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "usr-004",
    fullName: "Officer Musa Bello",
    assignedRole: "receptionist",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "usr-005",
    fullName: "Pharm. Titi Dike",
    assignedRole: "treatment_nurse",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "usr-006",
    fullName: "Prof. J. C. Okon",
    assignedRole: "director",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
];

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  authModalOpen: boolean;
  authMode: "signin" | "signup";
  authReady: boolean; // true once any saved session has been restored
  setAuthModalOpen: (open: boolean) => void;
  setAuthMode: (mode: "signin" | "signup") => void;
  login: (fullName: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    fullName: string,
    role: RoleId,
    password?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(DEFAULT_STUDENT_ACCOUNTS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authReady, setAuthReady] = useState(false);

  // Load existing accounts and active session from localStorage
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem("trinity_emr_users");
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...DEFAULT_STUDENT_ACCOUNTS];
          parsed.forEach((p: UserAccount) => {
            if (!merged.some((m) => m.fullName.toLowerCase() === p.fullName.toLowerCase())) {
              merged.push(p);
            }
          });
          setUsers(merged);
        }
      }

      const activeSession = localStorage.getItem("trinity_emr_active_session");
      if (activeSession) {
        const parsedUser = JSON.parse(activeSession);
        setCurrentUser(parsedUser);
      }
    } catch {
      // ignore parse error
    }
    setAuthReady(true);
  }, []);

  const login = async (
    fullName: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = fullName.trim().toLowerCase();
    const found = users.find(
      (u) => u.fullName.toLowerCase() === cleanName
    );

    if (!found) {
      return {
        success: false,
        error: `No staff or student profile found for '${fullName}'. Please Sign Up with your name and role.`,
      };
    }

    if (found.password && password && found.password !== password.trim()) {
      return { success: false, error: "Incorrect password. Please verify your credentials." };
    }

    setCurrentUser(found);
    localStorage.setItem("trinity_emr_active_session", JSON.stringify(found));
    setAuthModalOpen(false);
    return { success: true };
  };

  const signup = async (
    fullName: string,
    role: RoleId,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = fullName.trim();

    if (!cleanName) {
      return { success: false, error: "Full Name is required for registration." };
    }

    const existing = users.find(
      (u) => u.fullName.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      return {
        success: false,
        error: `'${cleanName}' is already registered. Please Sign In.`,
      };
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      fullName: cleanName,
      assignedRole: role,
      password: password?.trim() || "pass",
      createdAt: new Date().toISOString(),
    };

    const updatedList = [newUser, ...users];
    setUsers(updatedList);
    setCurrentUser(newUser);

    try {
      localStorage.setItem("trinity_emr_users", JSON.stringify(updatedList));
      localStorage.setItem("trinity_emr_active_session", JSON.stringify(newUser));
    } catch {
      // ignore storage error
    }

    setAuthModalOpen(false);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("trinity_emr_active_session");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        authModalOpen,
        authMode,
        authReady,
        setAuthModalOpen,
        setAuthMode,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
