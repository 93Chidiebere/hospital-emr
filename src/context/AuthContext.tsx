"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserAccount, RoleId } from "@/types/emr";

export const DEFAULT_ADMIN_TEACHER_ACCOUNTS: UserAccount[] = [
  {
    id: "adm-001",
    fullName: "Chidiebere (Super Admin)",
    email: "vchidiebere.vc@gmail.com",
    assignedRole: "director",
    isAdmin: true,
    isSuperAdmin: true,
    password: "Pass@word1",
    createdAt: "2026-10-20T00:00:00Z",
  },
  {
    id: "adm-002",
    fullName: "Chidiebere",
    email: "vincent.chidiebere@outlook.com",
    assignedRole: "director",
    isAdmin: true,
    password: "Pass@word1",
    createdAt: "2026-10-20T00:00:00Z",
  },
  {
    id: "adm-003",
    fullName: "Rita",
    email: "ritaeze53@gmail.com",
    assignedRole: "director",
    isAdmin: true,
    password: "Pass@word1",
    createdAt: "2026-10-20T00:00:00Z",
  },
  {
    id: "adm-004",
    fullName: "Salamah",
    email: "salamahalawiye@gmail.com",
    assignedRole: "director",
    isAdmin: true,
    password: "Pass@word1",
    createdAt: "2026-10-20T00:00:00Z",
  },
  {
    id: "adm-005",
    fullName: "Favour",
    email: "faladefavour@gmail.com",
    assignedRole: "director",
    isAdmin: true,
    password: "Pass@word1",
    createdAt: "2026-10-20T00:00:00Z",
  },
  {
    id: "adm-006",
    fullName: "Sunita",
    email: "nytaedu@gmail.com",
    assignedRole: "director",
    isAdmin: true,
    password: "Pass@word1",
    createdAt: "2026-10-20T00:00:00Z",
  },
  {
    id: "adm-007",
    fullName: "Fiyin",
    email: "anifowosefiyin@gmail.com",
    assignedRole: "director",
    isAdmin: true,
    password: "Pass@word1",
    createdAt: "2026-10-20T00:00:00Z",
  },
  {
    id: "adm-008",
    fullName: "Nancy",
    email: "nanchelotty@gmail.com",
    assignedRole: "director",
    isAdmin: true,
    password: "Pass@word1",
    createdAt: "2026-10-20T00:00:00Z",
  },
];

export const DEFAULT_STUDENT_ACCOUNTS: UserAccount[] = [
  ...DEFAULT_ADMIN_TEACHER_ACCOUNTS,
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
];

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  authModalOpen: boolean;
  authMode: "signin" | "signup";
  authReady: boolean;
  isDemoMode: boolean;
  setAuthModalOpen: (open: boolean) => void;
  setAuthMode: (mode: "signin" | "signup") => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
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
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Load existing accounts and active session from localStorage
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem("trinity_emr_users");
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...DEFAULT_STUDENT_ACCOUNTS];
          parsed.forEach((p: UserAccount) => {
            const exists = merged.some(
              (m) =>
                m.fullName.toLowerCase() === p.fullName.toLowerCase() ||
                (p.email && m.email && m.email.toLowerCase() === p.email.toLowerCase())
            );
            if (!exists) {
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
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const clean = identifier.trim().toLowerCase();
    if (!clean) {
      return { success: false, error: "Please enter your email or full name." };
    }

    const found = users.find(
      (u) =>
        u.fullName.toLowerCase() === clean ||
        (u.email && u.email.toLowerCase() === clean)
    );

    if (!found) {
      return {
        success: false,
        error: `No staff or teacher profile found for '${identifier}'. Please check credentials or sign up.`,
      };
    }

    if (found.password && password && found.password !== password.trim()) {
      return { success: false, error: "Incorrect password. Please verify your credentials." };
    }

    setCurrentUser(found);
    setIsDemoMode(false);
    try {
      localStorage.setItem("trinity_emr_active_session", JSON.stringify(found));
    } catch {}
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
    setIsDemoMode(false);

    try {
      localStorage.setItem("trinity_emr_users", JSON.stringify(updatedList));
      localStorage.setItem("trinity_emr_active_session", JSON.stringify(newUser));
    } catch {
      // ignore storage error
    }

    setAuthModalOpen(false);
    return { success: true };
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setCurrentUser(null);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setCurrentUser(null);
  };

  const logout = () => {
    setCurrentUser(null);
    setIsDemoMode(false);
    try {
      localStorage.removeItem("trinity_emr_active_session");
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        authModalOpen,
        authMode,
        authReady,
        isDemoMode,
        setAuthModalOpen,
        setAuthMode,
        enterDemoMode,
        exitDemoMode,
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
