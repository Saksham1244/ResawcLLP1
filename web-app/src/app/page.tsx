import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>

      {/* Top bar */}
      <div style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <ThemeToggle />
      </div>

      {/* Hero Card */}
      <div className="animate-fadeIn" style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>
        {/* Logo mark */}
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '72px', height: '72px', borderRadius: '22px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          boxShadow: '0 8px 32px var(--primary-glow)',
          marginBottom: '2rem',
          fontSize: '2rem'
        }}>
          ⚡
        </div>

        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
          <span className="text-gradient">Resawc LLP</span>
          <br />
          <span style={{ color: 'var(--foreground)' }}>Command Center</span>
        </h1>

        <p style={{ color: 'var(--secondary-foreground)', marginBottom: '2.5rem', fontSize: '1.1rem', lineHeight: 1.7 }}>
          Your centralized hub for CRM, team management, lead tracking, and real-time collaboration — built for your creative team.
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
          {['📊 Lead CRM', '✅ Task Boards', '💬 Team Chat', '📈 Analytics', '🔔 Notifications'].map(f => (
            <span key={f} className="badge badge-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>{f}</span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/login" className="btn btn-primary" style={{ padding: '0.85rem 2.25rem', fontSize: '1rem', borderRadius: 'var(--radius-md)' }}>
            Login to Workspace →
          </Link>
          <button className="btn btn-secondary" style={{ padding: '0.85rem 2.25rem', fontSize: '1rem' }}>
            Request Access
          </button>
        </div>
      </div>
    </main>
  );
}
