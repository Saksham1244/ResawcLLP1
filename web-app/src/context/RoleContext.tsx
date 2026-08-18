"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "admin" | "marketing" | "editor";

export type CurrentUser = {
  id?: string;
  name: string;
  role: UserRole;
  initials: string;
  email: string;
  token?: string;
};

// Passwords and hardcoded users have been removed for security.

type RoleContextType = {
  user: CurrentUser | null;
  login: (user: CurrentUser, token: string) => void;
  logout: () => void;
  isHydrated: boolean;
};

const RoleContext = createContext<RoleContextType>({
  user: null,
  login: () => {},
  logout: () => {},
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
    const storedToken = localStorage.getItem("authToken");
    
    if (storedEmail && storedRole && storedName && storedToken) {
      setUser({
        id: storedId || `db-user-${storedEmail}`,
        email: storedEmail,
        role: storedRole,
        name: storedName,
        initials: storedName.substring(0, 2).toUpperCase(),
        token: storedToken
      });
      
      // Setup global fetch interceptor to automatically add the Authorization header
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        let [resource, config] = args;
        if (typeof resource === 'string' && resource.startsWith('/api/') && !resource.startsWith('/api/auth')) {
          config = config || {};
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${storedToken}`
          };
        }
        return originalFetch(resource, config);
      };
    } else {
      setUser(null);
    }
    setIsHydrated(true);
  }, []);

  const login = (userData: CurrentUser, token: string) => {
    userData.token = token;
    setUser(userData);
    localStorage.setItem("userEmail", userData.email);
    localStorage.setItem("userRole", userData.role);
    localStorage.setItem("userName", userData.name);
    localStorage.setItem("authToken", token);
    if (userData.id) localStorage.setItem("userId", userData.id);

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let [resource, config] = args;
      if (typeof resource === 'string' && resource.startsWith('/api/') && !resource.startsWith('/api/auth')) {
        config = config || {};
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      return originalFetch(resource, config);
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("authToken");
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
