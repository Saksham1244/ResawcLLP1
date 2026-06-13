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
  login: (user: CurrentUser) => void;
  isHydrated: boolean;
};

const RoleContext = createContext<RoleContextType>({
  user: null,
  login: () => {},
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

  const login = (userData: CurrentUser) => {
    setUser(userData);
    localStorage.setItem("userEmail", userData.email);
    localStorage.setItem("userRole", userData.role);
    localStorage.setItem("userName", userData.name);
    if (userData.id) localStorage.setItem("userId", userData.id);
  };

  return (
    <RoleContext.Provider value={{ user, login, isHydrated }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
