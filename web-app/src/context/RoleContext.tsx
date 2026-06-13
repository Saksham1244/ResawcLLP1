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

// Passwords and hardcoded users have been removed for security.

type RoleContextType = {
  user: CurrentUser | null;
  isHydrated: boolean;
};

const RoleContext = createContext<RoleContextType>({
  user: null,
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

  return (
    <RoleContext.Provider value={{ user, isHydrated }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
