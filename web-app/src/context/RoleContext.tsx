"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "marketing" | "editor";

export type CurrentUser = {
  name: string;
  role: UserRole;
  initials: string;
};

const USERS: Record<UserRole, CurrentUser> = {
  admin: { name: "Alex Johnson", role: "admin", initials: "AJ" },
  marketing: { name: "Sarah Connor", role: "marketing", initials: "SC" },
  editor: { name: "Mike Davis", role: "editor", initials: "MD" },
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
  const setRole = (role: UserRole) => setUser(USERS[role]);
  return (
    <RoleContext.Provider value={{ user, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
