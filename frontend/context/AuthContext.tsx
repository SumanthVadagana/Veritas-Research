"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authMode: "signin" | "signup";
  openAuthModal: (mode?: "signin" | "signup") => void;
  closeAuthModal: () => void;
  login: (email: string, name?: string) => void;
  signup: (email: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  // Load persisted user session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("veritas_user_session");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  const openAuthModal = (mode: "signin" | "signup" = "signin") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = (email: string, name?: string) => {
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      name: name || email.split("@")[0] || "Researcher",
      role: "Pro Plan",
    };
    setUser(newUser);
    localStorage.setItem("veritas_user_session", JSON.stringify(newUser));
    closeAuthModal();
  };

  const signup = (email: string, name: string) => {
    login(email, name);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("veritas_user_session");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthModalOpen,
        authMode,
        openAuthModal,
        closeAuthModal,
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
