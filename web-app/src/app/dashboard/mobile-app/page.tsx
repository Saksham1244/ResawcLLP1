"use client";

import { Smartphone, QrCode, Download, Apple, PlaySquare, ArrowRight } from "lucide-react";

export default function MobileAppPage() {
  return (
    <div className="animate-fadeIn" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px var(--primary-glow)' }}>
          <Smartphone size={40} color="#fff" />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
          Get the Resawc Mobile App
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Mark attendance with geofencing, manage leads on the go, and stay connected with the team directly from your phone.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        {/* Step 1 */}
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--overlay-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid var(--surface-border)' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>1</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Download Expo Go</h2>
          <p className="text-muted text-sm" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
            The Resawc app runs on Expo. Download the official Expo Go client on your iOS or Android device first.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <a href="https://apps.apple.com/us/app/expo-go/id982107779" target="_blank" rel="noreferrer" className="btn" style={{ background: '#000', color: '#fff', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '12px', border: '1px solid #333' }}>
              <Apple size={20} /> App Store
            </a>
            <a href="https://play.google.com/store/apps/details?id=host.exp.exponent" target="_blank" rel="noreferrer" className="btn" style={{ background: '#000', color: '#fff', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '12px', border: '1px solid #333' }}>
              <PlaySquare size={20} /> Google Play
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--overlay-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid var(--surface-border)' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>2</span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Scan & Connect</h2>
          <p className="text-muted text-sm" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
            Open Expo Go and scan the QR code below, or manually enter the project URL to load the Resawc app workspace.
          </p>
          
          <div style={{ background: '#fff', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
            {/* Placeholder for actual Expo QR code */}
            <div style={{ width: '180px', height: '180px', background: 'var(--background)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--surface-border)' }}>
              <QrCode size={48} color="var(--muted)" style={{ marginBottom: '0.5rem' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Project QR Code</span>
            </div>
          </div>

          <div style={{ width: '100%', background: 'var(--overlay-bg)', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--surface-border)' }}>
            <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--secondary-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              exp://exp.host/@resawc/app
            </span>
            <button className="btn btn-ghost" style={{ padding: '0.4rem', color: 'var(--primary)' }}>
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(99,102,241,0.15))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Need Help?</h3>
          <p className="text-muted text-sm" style={{ lineHeight: 1.6 }}>
            Make sure you are logged in with your assigned team credentials. If you experience any issues loading the app via Expo Go, contact the Admin for an updated invite link.
          </p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
          View Documentation <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
