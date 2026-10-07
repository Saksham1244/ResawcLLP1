"use client";

import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        // Purge any saved dark theme from localStorage
        localStorage.removeItem("theme");
        localStorage.setItem("theme", "light");
        
        // Ensure root DOM elements strictly enforce light mode
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.documentElement.setAttribute("data-theme", "light");
        document.documentElement.style.colorScheme = "light";
        if (document.body) {
          document.body.classList.remove("dark");
          document.body.classList.add("light");
          document.body.style.colorScheme = "light";
        }
      }
    } catch {}
  }, []);

  return <>{children}</>;
}
