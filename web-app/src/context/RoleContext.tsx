"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "admin" | "marketing" | "editor";

export type CurrentUser = {
  id?: string;
  name: string;
  role: UserRole;
  initials: string;
  email: string;
};

// Master user list — single source of truth
export const MASTER_USERS: Record<string, { password: string; user: CurrentUser }> = {
  "mukul@resawc.com":     { password: "Mukul@123",     user: { name: "Mukul",     role: "admin",     initials: "MK", email: "mukul@resawc.com" } },
  "mukesh@resawc.com":    { password: "Mukesh@123",    user: { name: "Mukesh",    role: "admin",     initials: "MS", email: "mukesh@resawc.com" } },
  "marketing@resawc.com": { password: "Marketing@123", user: { name: "Marketing", role: "marketing", initials: "MR", email: "marketing@resawc.com" } },
  "editor@resawc.com":    { password: "Editor@123",    user: { name: "Editor",    role: "editor",    initials: "ED", email: "editor@resawc.com" } },
};

type RoleContextType = {
  user: CurrentUser | null;
  setRole: (role: UserRole) => void;
  isHydrated: boolean;
};

const RoleContext = createContext<RoleContextType>({
  user: null,
  setRole: () => {},
  isHydrated: false,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    const storedRole = localStorage.getItem("userRole") as UserRole;
    const storedName = localStorage.getItem("userName");
    const storedId = localStorage.getItem("userId");
    
    if (storedEmail && storedRole && storedName) {
      // Hydrate from localStorage for users created via the UI (e.g. Rahul)
      setUser({
        id: storedId || `db-user-${storedEmail}`,
        email: storedEmail,
        role: storedRole,
        name: storedName,
        initials: storedName.substring(0, 2).toUpperCase()
      });
    } else {
      setUser(null);
    }
    setIsHydrated(true);
  }, []);

  const handleSetRole = (role: UserRole) => {
    const found = Object.values(MASTER_USERS).find(u => u.user.role === role);
    if (found) {
      found.user.id = `mock-id-${role}`;
      setUser(found.user);
      localStorage.setItem("userEmail", found.user.email);
      localStorage.setItem("userRole", role);
    }
  };

  return (
    <RoleContext.Provider value={{ user, setRole: handleSetRole, isHydrated }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
