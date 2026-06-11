"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "admin" | "marketing" | "editor";

export type CurrentUser = {
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
  user: CurrentUser;
  setRole: (role: UserRole) => void;
};

const RoleContext = createContext<RoleContextType>({
  user: MASTER_USERS["mukul@resawc.com"].user,
  setRole: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(MASTER_USERS["mukul@resawc.com"].user);

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail && MASTER_USERS[storedEmail]) {
      setUser(MASTER_USERS[storedEmail].user);
    }
  }, []);

  const setRole = (role: UserRole) => {
    const found = Object.values(MASTER_USERS).find(u => u.user.role === role);
    if (found) {
      setUser(found.user);
      localStorage.setItem("userEmail", found.user.email);
      localStorage.setItem("userRole", role);
    }
  };

  return (
    <RoleContext.Provider value={{ user, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
