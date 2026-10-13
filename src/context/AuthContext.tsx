"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserAccount, RoleId } from "@/types/emr";

export const DEFAULT_STUDENT_ACCOUNTS: UserAccount[] = [
  {
    id: "usr-001",
    fullName: "Nurse Mary Okon",
    studentId: "NUR-001",
    assignedRole: "triage_nurse",
    institution: "Faculty of Nursing & Health Sciences",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "usr-002",
    fullName: "Dr. Kelechi Adeyemi",
    studentId: "DOC-001",
    assignedRole: "doctor",
    institution: "Faculty of Clinical Medicine",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "usr-003",
    fullName: "MLS Emeka Chukwuma",
    studentId: "MLS-001",
    assignedRole: "mls",
    institution: "Medical Laboratory Sciences",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "usr-004",
    fullName: "Officer Musa Bello",
    studentId: "REC-001",
    assignedRole: "receptionist",
    institution: "Health Records & Information",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "usr-005",
    fullName: "Nurse Titi Dike",
    studentId: "TRT-001",
    assignedRole: "treatment_nurse",
    institution: "Faculty of Nursing & Health Sciences",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
  {
    id: "usr-006",
    fullName: "Prof. J. C. Okon",
    studentId: "DIR-001",
    assignedRole: "director",
    institution: "Medical Directorate",
    password: "pass",
    createdAt: "2026-10-13T08:00:00Z",
  },
];

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  authModalOpen: boolean;
  authMode: "signin" | "signup";
  setAuthModalOpen: (open: boolean) => void;
  setAuthMode: (mode: "signin" | "signup") => void;
  login: (studentId: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    fullName: string,
    studentId: string,
    role: RoleId,
    password?: string,
    institution?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(DEFAULT_STUDENT_ACCOUNTS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Load existing accounts and active session from localStorage
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem("trinity_emr_users");
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge custom accounts with defaults
          const merged = [...DEFAULT_STUDENT_ACCOUNTS];
          parsed.forEach((p: UserAccount) => {
            if (!merged.some((m) => m.studentId === p.studentId)) {
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
  }, []);

  const login = async (
    studentId: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanId = studentId.trim().toUpperCase();
    const found = users.find(
      (u) => u.studentId.toUpperCase() === cleanId || u.fullName.toLowerCase() === studentId.trim().toLowerCase()
    );

    if (!found) {
      return {
        success: false,
        error: `No student record found for '${studentId}'. Please check your Matric/Student ID or Sign Up.`,
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
    studentId: string,
    role: RoleId,
    password?: string,
    institution: string = "Faculty of Nursing & Health Sciences"
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanId = studentId.trim().toUpperCase();
    const cleanName = fullName.trim();

    if (!cleanName || !cleanId) {
      return { success: false, error: "Full Name and Student/Matric Number are required." };
    }

    const existing = users.find((u) => u.studentId.toUpperCase() === cleanId);
    if (existing) {
      return {
        success: false,
        error: `A student with ID '${cleanId}' is already registered. Please Sign In.`,
      };
    }

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      fullName: cleanName,
      studentId: cleanId,
      assignedRole: role,
      institution: institution || "Faculty of Nursing & Health Sciences",
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
