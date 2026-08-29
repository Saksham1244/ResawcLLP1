"use client";

import { useState, useEffect, useCallback } from "react";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "next/navigation";
import { 
  Clock, MapPin, CheckCircle2, AlertCircle, ArrowLeft, 
  LogOut, ShieldCheck, Navigation, Calendar 
} from "lucide-react";

// Office Location: South Extension I, New Delhi
const OFFICE_LAT = 28.5687;
const OFFICE_LON = 77.2203;
const ALLOWED_RADIUS_METERS = 300; // 300m grace zone

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
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

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", weekday: "short", month: "short", day: "numeric", year: "numeric" }));
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

  // Fetch today's status
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

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)", padding: "1.5rem" }}>
        <div className="glass-card" style={{ maxWidth: "400px", width: "100%", textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--primary-glow)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>Resawc Attendance Portal</h2>
          <p className="text-muted text-sm" style={{ marginBottom: "2rem" }}>
            Please log in to your employee account to record your attendance.
          </p>
          <button onClick={() => router.push("/")} className="btn btn-primary" style={{ width: "100%", padding: "0.9rem", fontWeight: 700 }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", flexDirection: "column", padding: "1.5rem 1rem" }}>
      {/* Top Navbar */}
      <div style={{ maxWidth: "600px", width: "100%", margin: "0 auto 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => router.push("/dashboard")} className="btn btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.8rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>{user.name}</p>
            <p className="text-muted" style={{ fontSize: "0.75rem", margin: 0, textTransform: "capitalize" }}>{user.role}</p>
          </div>
        </div>
      </div>

      {/* Main Check-In Card */}
      <div style={{ maxWidth: "600px", width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div className="glass-card" style={{ padding: "2.5rem 1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* Live Digital Clock */}
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <Clock size={30} color="var(--primary)" />
          </div>

          <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
            {currentDate || "Loading Date..."}
          </p>
          <h1 style={{ fontSize: "2.8rem", fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.05em", color: "var(--foreground)", margin: "0 0 1rem 0" }}>
            {currentTime || "--:--:--"}
          </h1>

          {/* Location Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.9rem", borderRadius: "999px", background: "var(--overlay-bg)", border: "1px solid var(--surface-border)", fontSize: "0.8rem", color: "var(--secondary-foreground)", marginBottom: "2rem" }}>
            <MapPin size={14} color="var(--primary)" />
            <span>South Extension I, New Delhi (HQ)</span>
          </div>

          {/* Status Alert */}
          {statusMessage && (
            <div style={{
              padding: "0.85rem 1rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", fontSize: "0.85rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              background: statusMessage.type === "success" ? "rgba(16,185,129,0.12)" : statusMessage.type === "error" ? "rgba(239,68,68,0.12)" : "rgba(99,102,241,0.12)",
              color: statusMessage.type === "success" ? "#10b981" : statusMessage.type === "error" ? "#ef4444" : "var(--primary)",
              border: `1px solid ${statusMessage.type === "success" ? "rgba(16,185,129,0.3)" : statusMessage.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)"}`
            }}>
              {statusMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* GPS Proximity Meter */}
          <div style={{ background: "var(--overlay-bg)", border: "1px solid var(--surface-border)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Navigation size={18} color={gpsStatus === "in_range" ? "#10b981" : gpsStatus === "out_of_range" ? "#f59e0b" : "var(--muted)"} />
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 700, margin: 0 }}>Office Geofence Check</p>
                <p className="text-muted" style={{ fontSize: "0.75rem", margin: 0 }}>
                  {gpsStatus === "locating" ? "Locating device..." : gpsStatus === "in_range" ? `Verified (${distanceMeters}m away)` : gpsStatus === "out_of_range" ? `${distanceMeters}m from office` : "Location access ready"}
                </p>
              </div>
            </div>
            <button onClick={requestLocation} className="btn btn-ghost" style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", color: "var(--primary)" }}>
              Refresh GPS
            </button>
          </div>

          {/* Action Button */}
          {isCheckedIn ? (
            <div>
              <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
                <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", color: "#10b981", fontWeight: 700, fontSize: "0.95rem", margin: 0 }}>
                  <CheckCircle2 size={18} /> Currently Checked In since {checkInTime}
                </p>
              </div>
              <button 
                onClick={handleAttendanceAction}
                disabled={loading}
                style={{
                  width: "100%", padding: "1.1rem", borderRadius: "var(--radius-md)", border: "none", cursor: loading ? "not-allowed" : "pointer",
                  background: "#ef4444", color: "#fff", fontWeight: 800, fontSize: "1.05rem",
                  boxShadow: "0 6px 20px rgba(239,68,68,0.35)", transition: "all 0.2s"
                }}>
                {loading ? "Recording Check Out..." : "Check Out for Today"}
              </button>
            </div>
          ) : (
            <div>
              {checkOutTime && (
                <div style={{ background: "var(--secondary)", padding: "0.85rem", borderRadius: "var(--radius-md)", marginBottom: "1.25rem", fontSize: "0.85rem", color: "var(--muted)" }}>
                  Shift Completed today: {checkInTime} – {checkOutTime}
                </div>
              )}
              <button 
                onClick={handleAttendanceAction}
                disabled={loading}
                style={{
                  width: "100%", padding: "1.1rem", borderRadius: "var(--radius-md)", border: "none", cursor: loading ? "not-allowed" : "pointer",
                  background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
                  color: "var(--primary-foreground, #fff)", fontWeight: 800, fontSize: "1.05rem",
                  boxShadow: "0 6px 20px var(--primary-glow)", transition: "all 0.2s"
                }}>
                {loading ? "Recording Attendance..." : "Mark Check In"}
              </button>
            </div>
          )}
        </div>

        {/* Quick Instructions Card */}
        <div className="glass-card" style={{ padding: "1.25rem 1.5rem" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>📱 Easy Web Check-In</h3>
          <p className="text-muted" style={{ fontSize: "0.8rem", lineHeight: 1.6, margin: 0 }}>
            Bookmark this page on your smartphone or computer browser. Open it when you arrive at the office, allow location access when prompted, and tap <strong>Mark Check In</strong>. No mobile app download required!
          </p>
        </div>
      </div>
    </div>
  );
}
