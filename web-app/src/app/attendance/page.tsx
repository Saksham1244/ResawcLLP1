"use client";

import { useState, useEffect, useCallback } from "react";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "next/navigation";
import {
  Clock, MapPin, CheckCircle2, AlertCircle, ArrowLeft,
  ShieldCheck, Navigation, XCircle, Loader
} from "lucide-react";

// Office Location: South Extension I, New Delhi
const OFFICE_LAT = 28.5687;
const OFFICE_LON = 77.2203;
const ALLOWED_RADIUS_METERS = 300; // 300m grace zone

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function StandaloneAttendancePage() {
  const { user, isHydrated } = useRole();
  const router = useRouter();

  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // GPS State
  const [gpsStatus, setGpsStatus] = useState<"idle" | "locating" | "in_range" | "out_of_range" | "denied">("idle");
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Clock Update (IST)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", weekday: "long", month: "long", day: "numeric", year: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getISTDate = () => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getISTTime = () =>
    new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });

  // Fetch today's attendance status
  const fetchTodayStatus = useCallback(async () => {
    if (!user?.email) return;
    try {
      const todayStr = getISTDate();
      const res = await fetch(`/api/attendance?start=${todayStr}&end=${todayStr}&email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const todayRecord = data.data.find((r: any) => r.date === todayStr);
        if (todayRecord) {
          const inTime = todayRecord.timeIn || todayRecord.systemLoginTime || todayRecord.mobileLoginTime;
          const outTime = todayRecord.timeOut;

          if (inTime && (!outTime || outTime === "--" || outTime === "")) {
            setIsCheckedIn(true);
            setCheckInTime(inTime);
            setCheckOutTime(null);
          } else if (inTime && outTime) {
            setIsCheckedIn(false);
            setCheckInTime(inTime);
            setCheckOutTime(outTime);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load attendance state", e);
    }
  }, [user]);

  // Request GPS Location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      setStatusMessage({ text: "Geolocation is not supported by your browser.", type: "error" });
      return;
    }

    setGpsStatus("locating");
    setStatusMessage({ text: "Acquiring GPS coordinates...", type: "info" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        const dist = calculateDistanceMeters(latitude, longitude, OFFICE_LAT, OFFICE_LON);
        setDistanceMeters(dist);

        if (dist <= ALLOWED_RADIUS_METERS) {
          setGpsStatus("in_range");
          setStatusMessage({ text: `Within office perimeter (${dist}m away). Ready to check in!`, type: "success" });
        } else {
          setGpsStatus("out_of_range");
          setStatusMessage({ text: `You are ${dist}m away from office (allowed: ${ALLOWED_RADIUS_METERS}m).`, type: "error" });
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        setGpsStatus("denied");
        setStatusMessage({ text: "Location permission denied. Please allow location access in your browser settings.", type: "error" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (user?.id) {
      fetchTodayStatus();
      requestLocation();
    }
  }, [user, fetchTodayStatus]);

  const handleAttendanceAction = async () => {
    if (!user?.id) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const todayStr = getISTDate();
      const timeNow = getISTTime();
      const source = isCheckedIn ? "checkout" : "web";

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          date: todayStr,
          timeIn: timeNow,
          source,
          requestorRole: user.role,
          latitude: userCoords?.lat,
          longitude: userCoords?.lng,
        })
      });

      const result = await res.json();

      if (result.success) {
        setStatusMessage({
          text: isCheckedIn ? `Successfully checked out at ${timeNow}!` : `Successfully checked in at ${timeNow}!`,
          type: "success"
        });
        await fetchTodayStatus();
      } else {
        setStatusMessage({ text: result.error || "Failed to record attendance.", type: "error" });
      }
    } catch (e) {
      setStatusMessage({ text: "Network error. Please check your connection and try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isHydrated) return null;

  const font = 'Inter, system-ui, -apple-system, sans-serif';

  // ── Not logged in ──
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F7FB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: font }}>
        <div style={{ maxWidth: '400px', width: '100%', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShieldCheck size={30} color="#1A56DB" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>Resawc Attendance Portal</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 2rem', lineHeight: 1.6 }}>
            Please log in to your employee account to record your attendance.
          </p>
          <button
            onClick={() => router.push("/")}
            style={{ width: '100%', padding: '0.85rem', background: '#1A56DB', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: font }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // GPS pill colors
  const gpsPillColor = gpsStatus === "in_range" ? { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' }
    : gpsStatus === "out_of_range" ? { bg: '#FFF7ED', text: '#D97706', border: '#FDE68A' }
    : gpsStatus === "denied" ? { bg: '#FEF2F2', text: '#EF4444', border: '#FCA5A5' }
    : { bg: '#EFF6FF', text: '#1A56DB', border: '#BFDBFE' };

  const gpsLabel = gpsStatus === "locating" ? "Locating…"
    : gpsStatus === "in_range" ? `In range — ${distanceMeters}m away`
    : gpsStatus === "out_of_range" ? `${distanceMeters}m from office`
    : gpsStatus === "denied" ? "Location denied"
    : "Awaiting location";

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FB', fontFamily: font, display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Navbar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Logo mark */}
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#1A56DB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', color: '#fff' }}>R</div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Resawc CRM</span>
          <span style={{ fontSize: '13px', color: '#9CA3AF', marginLeft: '4px' }}>/ Attendance Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: 0 }}>{user.name}</p>
            <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, textTransform: 'capitalize' }}>{user.role}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.45rem 0.85rem', fontSize: '13px', fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: '6px', background: '#fff', color: '#6B7280', cursor: 'pointer', fontFamily: font }}
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* ── Main Check-In Card ── */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '2.5rem 2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>

            {/* Clock Icon */}
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Clock size={26} color="#1A56DB" />
            </div>

            {/* Date */}
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>
              {currentDate || "Loading…"}
            </p>

            {/* Large Digital Clock */}
            <h1 style={{ fontSize: '52px', fontWeight: 800, fontFamily: '"Courier New", monospace', letterSpacing: '0.04em', color: '#111827', margin: '0 0 1.25rem', lineHeight: 1 }}>
              {currentTime || "--:--:--"}
            </h1>

            {/* IST badge */}
            <span style={{ display: 'inline-block', padding: '2px 10px', background: '#F3F4F6', color: '#6B7280', borderRadius: '999px', fontSize: '11px', fontWeight: 600, marginBottom: '1rem' }}>
              IST (Asia/Kolkata)
            </span>

            {/* Office Location Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.4rem 0.9rem', borderRadius: '999px', background: '#F9FAFB', border: '1px solid #E5E7EB', fontSize: '13px', color: '#374151', marginBottom: '1.5rem' }}>
              <MapPin size={13} color="#1A56DB" />
              <span>South Extension I, New Delhi (HQ)</span>
            </div>

            {/* GPS Status Pill */}
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.75rem 1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Navigation size={16} color={gpsPillColor.text} />
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827', margin: 0 }}>Office Geofence</p>
                  <span style={{
                    display: 'inline-block', marginTop: '3px', padding: '1px 8px', borderRadius: '999px',
                    background: gpsPillColor.bg, color: gpsPillColor.text, border: `1px solid ${gpsPillColor.border}`,
                    fontSize: '11px', fontWeight: 600,
                  }}>
                    {gpsLabel}
                  </span>
                </div>
              </div>
              <button
                onClick={requestLocation}
                style={{ fontSize: '12px', color: '#1A56DB', background: 'none', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '0.3rem 0.65rem', cursor: 'pointer', fontWeight: 500, fontFamily: font }}
              >
                Refresh
              </button>
            </div>

            {/* Status Alert */}
            {statusMessage && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '13px',
                display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left',
                background: statusMessage.type === "success" ? '#ECFDF5' : statusMessage.type === "error" ? '#FEF2F2' : '#EFF6FF',
                color: statusMessage.type === "success" ? '#059669' : statusMessage.type === "error" ? '#EF4444' : '#1A56DB',
                border: `1px solid ${statusMessage.type === "success" ? '#A7F3D0' : statusMessage.type === "error" ? '#FCA5A5' : '#BFDBFE'}`,
              }}>
                {statusMessage.type === "success"
                  ? <CheckCircle2 size={15} />
                  : statusMessage.type === "error"
                  ? <XCircle size={15} />
                  : <Loader size={15} />}
                <span style={{ lineHeight: 1.5 }}>{statusMessage.text}</span>
              </div>
            )}

            {/* Already completed shift banner */}
            {!isCheckedIn && checkOutTime && (
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <CheckCircle2 size={14} color="#059669" />
                Shift completed today: <strong>{checkInTime}</strong> – <strong>{checkOutTime}</strong>
              </div>
            )}

            {/* Currently Checked In Banner */}
            {isCheckedIn && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#059669" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>
                  Checked in since {checkInTime}
                </span>
              </div>
            )}

            {/* Action Button */}
            {isCheckedIn ? (
              <button
                onClick={handleAttendanceAction}
                disabled={loading}
                style={{
                  width: '100%', padding: '1rem', borderRadius: '8px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#FCA5A5' : '#EF4444',
                  color: '#fff', fontWeight: 800, fontSize: '16px', fontFamily: font,
                  boxShadow: '0 4px 16px rgba(239,68,68,0.3)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {loading ? <><Loader size={18} /> Recording Check Out…</> : '🔴 Check Out for Today'}
              </button>
            ) : (
              <button
                onClick={handleAttendanceAction}
                disabled={loading}
                style={{
                  width: '100%', padding: '1rem', borderRadius: '8px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#93C5FD' : '#1A56DB',
                  color: '#fff', fontWeight: 800, fontSize: '16px', fontFamily: font,
                  boxShadow: '0 4px 16px rgba(26,86,219,0.3)', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {loading ? <><Loader size={18} /> Recording Attendance…</> : '🟢 Mark Check In'}
              </button>
            )}
          </div>

          {/* ── Instructions Card ── */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>📱 Easy Web Check-In</h3>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.65, margin: 0 }}>
              Bookmark this page on your smartphone or computer browser. Open it when you arrive at the office,
              allow location access when prompted, and tap <strong style={{ color: '#111827' }}>Mark Check In</strong>. No app download required!
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
