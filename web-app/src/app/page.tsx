'use client';
import Link from 'next/link';

const features = [
  {
    icon: '📊',
    title: 'Lead CRM',
    desc: 'Nurture leads from prospect to customer. Track interactions, assign owners, and close deals faster.',
    bg: '#EFF6FF',
    iconBg: '#DBEAFE',
    border: '#BFDBFE',
  },
  {
    icon: '✅',
    title: 'Task Management',
    desc: 'Organize tasks, set priorities, track progress, and meet every deadline — across your whole team.',
    bg: '#F0FDF4',
    iconBg: '#DCFCE7',
    border: '#BBF7D0',
  },
  {
    icon: '🖥️',
    title: 'Live PC Monitoring',
    desc: 'Real-time visibility into team activity, productivity scores, and application usage from any device.',
    bg: '#FFF7ED',
    iconBg: '#FFEDD5',
    border: '#FED7AA',
  },
  {
    icon: '🕐',
    title: 'Team Attendance',
    desc: 'GPS-verified check-ins, monthly logs, leave management, and instant admin notifications.',
    bg: '#FAF5FF',
    iconBg: '#F3E8FF',
    border: '#E9D5FF',
  },
];

const stats = [
  { value: '100%', label: 'Team Visibility' },
  { value: 'Real-time', label: 'Live Monitoring' },
  { value: 'GPS', label: 'Verified Attendance' },
  { value: 'All-in-one', label: 'CRM Platform' },
];

export default function Home() {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: '#F5F7FB', minHeight: '100vh', color: '#111827' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E7EB',
        padding: '0 2rem',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
            <img src="/resawc-logo.png" alt="Resawc" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '17px', color: '#111827', letterSpacing: '-0.3px' }}>
            Resawc <span style={{ color: '#1A56DB' }}>LLP</span>
          </span>
        </div>

        {/* Nav links + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Features', 'Team', 'Contact'].map(item => (
              <a key={item} href="#features" style={{ fontSize: '14px', fontWeight: 500, color: '#4B5563', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#1A56DB')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
              >{item}</a>
            ))}
          </div>
          <Link href="/login" style={{
            background: '#1A56DB', color: '#fff',
            padding: '0.55rem 1.4rem', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 1px 3px rgba(26,86,219,0.3)',
            transition: 'background 0.2s',
          }}>
            Sign In →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        textAlign: 'center',
        padding: '6rem 2rem 4rem',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: '20px', padding: '4px 14px',
          fontSize: '12.5px', fontWeight: 600, color: '#1D4ED8',
          marginBottom: '1.5rem',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1A56DB', display: 'inline-block' }} />
          Internal CRM Platform · Resawc LLP
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          color: '#0F172A',
          letterSpacing: '-0.04em',
          marginBottom: '1.25rem',
        }}>
          Manage Your Team, Leads &<br />
          <span style={{ color: '#1A56DB' }}>Workspace — All in One Place</span>
        </h1>

        <p style={{
          fontSize: '1.05rem', color: '#6B7280', lineHeight: 1.75,
          maxWidth: '560px', margin: '0 auto 2.5rem',
        }}>
          The all-in-one platform for lead management, team collaboration, real-time PC monitoring, and GPS-verified attendance — purpose-built for Resawc.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login" style={{
            background: '#1A56DB', color: '#fff',
            padding: '0.85rem 2rem', borderRadius: '10px',
            fontSize: '15px', fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(26,86,219,0.35)',
          }}>
            Sign In to Workspace →
          </Link>
          <a href="#features" style={{
            background: '#fff', color: '#374151',
            padding: '0.85rem 2rem', borderRadius: '10px',
            fontSize: '15px', fontWeight: 600,
            textDecoration: 'none',
            border: '1.5px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            Explore Features
          </a>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{
        background: '#fff',
        borderTop: '1px solid #E5E7EB',
        borderBottom: '1px solid #E5E7EB',
        padding: '1.75rem 2rem',
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem', textAlign: 'center',
        }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1A56DB', letterSpacing: '-0.5px' }}>{s.value}</div>
              <div style={{ fontSize: '12.5px', color: '#6B7280', fontWeight: 500, marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '5rem 2rem', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', margin: '0 0 0.75rem' }}>
            Everything Your Team Needs
          </h2>
          <p style={{ color: '#6B7280', fontSize: '15px', maxWidth: '480px', margin: '0 auto' }}>
            Built for the Resawc team — from sales to operations, all workflows in one platform.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1.25rem',
        }}>
          {features.map(f => (
            <div key={f.title} style={{
              background: f.bg,
              border: `1.5px solid ${f.border}`,
              borderRadius: '14px',
              padding: '1.75rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '48px', height: '48px',
                background: f.iconBg,
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', marginBottom: '1rem',
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '0 0 0.5rem' }}>{f.title}</h3>
              <p style={{ fontSize: '13.5px', color: '#6B7280', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        background: 'linear-gradient(135deg, #1A56DB 0%, #1e40af 100%)',
        margin: '0 2rem 5rem',
        borderRadius: '18px',
        padding: '3.5rem 2rem',
        textAlign: 'center',
        maxWidth: '920px',
        marginLeft: 'auto',
        marginRight: 'auto',
        boxShadow: '0 8px 32px rgba(26,86,219,0.3)',
      }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1.25rem', border: '2px solid rgba(255,255,255,0.3)' }}>
          <img src="/resawc-logo.png" alt="Resawc" style={{ width: '56px', height: '56px', objectFit: 'cover' }} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 0 0.75rem', letterSpacing: '-0.03em' }}>
          Ready to get started?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '15px', marginBottom: '2rem' }}>
          Sign in with your Resawc credentials to access your workspace.
        </p>
        <Link href="/login" style={{
          display: 'inline-block',
          background: '#fff', color: '#1A56DB',
          padding: '0.85rem 2.25rem', borderRadius: '10px',
          fontSize: '15px', fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
        }}>
          Sign In to Workspace →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #E5E7EB',
        padding: '1.75rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '960px', margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden' }}>
            <img src="/resawc-logo.png" alt="Resawc" style={{ width: '28px', height: '28px', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Resawc LLP</span>
        </div>
        <span style={{ fontSize: '12.5px', color: '#9CA3AF' }}>© {new Date().getFullYear()} Resawc LLP. Internal use only.</span>
      </footer>
    </div>
  );
}
