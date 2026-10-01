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

// Extend Window interface for original fetch reference
declare global {
  interface Window {
    __originalFetch?: typeof window.fetch;
  }
}

/**
 * Universal fetch with exponential backoff retry on HTTP 429 (Rate Limit) & network errors
 */
export async function fetchWithExponentialBackoff(
  input: RequestInfo | URL,
  init?: RequestInit,
  token?: string | null,
  maxRetries: number = 4
): Promise<Response> {
  const originalFetch =
    typeof window !== "undefined" && window.__originalFetch
      ? window.__originalFetch
      : fetch;

  let attempt = 0;
  const baseDelayMs = 1000;

  const config: RequestInit = { ...init };
  if (
    typeof input === "string" &&
    input.startsWith("/api/") &&
    !input.startsWith("/api/auth") &&
    token
  ) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  while (attempt <= maxRetries) {
    try {
      const response = await originalFetch(input, config);

      // Handle HTTP 429 Too Many Requests with Exponential Backoff
      if (response.status === 429) {
        attempt++;
        if (attempt > maxRetries) {
          console.warn(`[RateLimit] Max retries (${maxRetries}) exceeded for ${String(input)}`);
          return response;
        }

        const retryAfterHeader = response.headers.get("Retry-After");
        const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;
        const jitter = Math.random() * 200;
        const delayMs =
          retryAfterSec && !isNaN(retryAfterSec)
            ? retryAfterSec * 1000 + jitter
            : baseDelayMs * Math.pow(2, attempt - 1) + jitter;

        console.warn(
          `[RateLimit] 429 received on ${String(input)}. Exponential backoff: waiting ${Math.round(
            delayMs
          )}ms (retry ${attempt}/${maxRetries})...`
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      return response;
    } catch (networkError) {
      attempt++;
      if (attempt > maxRetries) throw networkError;

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 200;
      console.warn(
        `[Network] Request failed for ${String(input)}. Exponential backoff: retrying in ${Math.round(
          delayMs
        )}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return originalFetch(input, config);
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const setupFetchInterceptor = (token: string | null) => {
    if (typeof window === "undefined") return;
    if (!window.__originalFetch) {
      window.__originalFetch = window.fetch;
    }

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      return fetchWithExponentialBackoff(input, init, token);
    };
  };

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
        token: storedToken,
      });

      setupFetchInterceptor(storedToken);
    } else {
      setUser(null);
      setupFetchInterceptor(null);
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

    setupFetchInterceptor(token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("authToken");

    setupFetchInterceptor(null);
  };

  return (
    <RoleContext.Provider value={{ user, login, logout, isHydrated }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
