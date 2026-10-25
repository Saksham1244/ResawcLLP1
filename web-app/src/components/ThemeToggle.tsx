"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isClient) return <div style={{ width: 36, height: 36 }} />; // Placeholder

  return (
    <button 
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="btn" 
      style={{ 
        width: '36px', height: '36px', padding: '0', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--foreground)'
      }}
      aria-label="Toggle Dark Mode"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
