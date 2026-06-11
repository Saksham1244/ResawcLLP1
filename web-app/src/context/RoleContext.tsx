"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "admin" | "marketing" | "editor";

export type CurrentUser = {
  name: string;
  role: UserRole;
  initials: string;
  email: string;
};

const USERS: Record<UserRole, CurrentUser> = {
  admin:     { name: "Admin",     role: "admin",     initials: "AD", email: "admin@resawc.com" },
  marketing: { name: "Marketing", role: "marketing", initials: "MK", email: "marketing@resawc.com" },
  editor:    { name: "Editor",    role: "editor",    initials: "ED", email: "editor@resawc.com" },
};

type RoleContextType = {
  user: CurrentUser;
  setRole: (role: UserRole) => void;
};

const RoleContext = createContext<RoleContextType>({
  user: USERS.admin,
  setRole: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser>(USERS.admin);

  useEffect(() => {
    // Read the role that was stored during login
    const storedRole = localStorage.getItem("userRole") as UserRole | null;
    if (storedRole && USERS[storedRole]) {
      setUser(USERS[storedRole]);
    }
  }, []);

  const setRole = (role: UserRole) => {
    setUser(USERS[role]);
    localStorage.setItem("userRole", role);
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
