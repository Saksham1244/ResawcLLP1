"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Role-based credentials
  const USERS = [
    { email: "mukul@resawc.com",     password: "Mukul@123",     role: "admin" },
    { email: "mukesh@resawc.com",    password: "Mukesh@123",    role: "admin" },
    { email: "marketing@resawc.com", password: "Marketing@123", role: "marketing" },
    { email: "editor@resawc.com",    password: "Editor@123",    role: "editor" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const match = USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    setTimeout(() => {
      setLoading(false);
      if (match) {
        // Store role in localStorage for RoleContext
        localStorage.setItem("userRole", match.role);
        localStorage.setItem("userEmail", match.email);
        router.push("/dashboard");
      } else {
        setError("Invalid email or password.");
      }
    }, 800);
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }}>

      <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
        <ThemeToggle />
      </div>

      <div className="animate-fadeIn" style={{ maxWidth: '420px', width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            boxShadow: '0 6px 24px var(--primary-glow)',
            marginBottom: '1rem', fontSize: '1.5rem'
          }}>
            ⚡
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            Welcome back
          </h1>
          <p className="text-muted text-sm">Sign in to Resawc LLP Core</p>
        </div>

        {/* Form card */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="email" className="text-sm font-semibold">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@resawc.com"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="password" className="text-sm font-semibold">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-foreground)', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#ef4444', fontSize: '0.875rem', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', marginTop: '0.5rem', borderRadius: 'var(--radius-sm)' }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                  Signing in...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Sign In <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Credentials hint — remove before public launch */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credentials</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--secondary-foreground)' }}>🔴 <strong>Mukul (Admin):</strong> mukul@resawc.com / Mukul@123</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--secondary-foreground)' }}>🔴 <strong>Mukesh (Admin):</strong> mukesh@resawc.com / Mukesh@123</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--secondary-foreground)' }}>🟡 <strong>Marketing:</strong> marketing@resawc.com / Marketing@123</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--secondary-foreground)' }}>🟢 <strong>Editor:</strong> editor@resawc.com / Editor@123</p>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--secondary-foreground)' }}>
          <Link href="/" style={{ color: 'var(--primary-2)', fontWeight: 500 }}>← Back to Home</Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
