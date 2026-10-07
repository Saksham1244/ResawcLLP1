"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router          = useRouter();
  const { login }       = useRole();
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [focusedField,  setFocusedField]  = useState<string | null>(null);

  // Forgot Password modal state
  const [showForgot,    setShowForgot]    = useState(false);
  const [forgotEmail,   setForgotEmail]   = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirm, setForgotConfirm] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg,     setForgotMsg]     = useState("");
  const [forgotErr,     setForgotErr]     = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErr("");
    setForgotMsg("");
    if (!forgotEmail) return setForgotErr("Please enter your registered email");
    if (!forgotNewPass || forgotNewPass.length < 6) return setForgotErr("Password must be at least 6 characters");
    if (forgotNewPass !== forgotConfirm) return setForgotErr("Passwords do not match");

    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, newPassword: forgotNewPass }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotMsg(data.message || "Password reset successful! Please log in.");
        setTimeout(() => {
          setShowForgot(false);
          setEmail(forgotEmail);
          setForgotMsg("");
        }, 1800);
      } else {
        setForgotErr(data.error || "Failed to reset password");
      }
    } catch {
      setForgotErr("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Authenticate against the real database ────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        login(
          {
            id:       data.user.id,
            name:     data.user.name,
            email:    data.user.email,
            role:     data.user.role,
            initials: data.user.name.substring(0, 2).toUpperCase(),
          },
          data.token
        );
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (fieldName: string): React.CSSProperties => ({
    width:           "100%",
    padding:         "10px 14px",
    fontSize:        "14px",
    color:           "#111827",
    backgroundColor: "#fff",
    border:          `1.5px solid ${focusedField === fieldName ? "#1A56DB" : "#E5E7EB"}`,
    borderRadius:    "8px",
    outline:         "none",
    boxSizing:       "border-box",
    transition:      "border-color 0.15s",
    fontFamily:      "Inter, system-ui, sans-serif",
  });

  return (
    <main style={{
      minHeight:       "100vh",
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      backgroundColor: "#F5F7FB",
      fontFamily:      "Inter, system-ui, -apple-system, sans-serif",
      padding:         "24px",
    }}>

      {/* Card */}
      <div style={{
        width:           "100%",
        maxWidth:        "420px",
        backgroundColor: "#fff",
        border:          "1px solid #E5E7EB",
        borderRadius:    "12px",
        padding:         "40px 36px",
        boxShadow:       "0 4px 24px rgba(0,0,0,0.06)",
      }}>

        {/* Logo + Brand */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display:         "inline-flex",
            alignItems:      "center",
            justifyContent:  "center",
            width:           "72px",
            height:          "72px",
            borderRadius:    "50%",
            overflow:        "hidden",
            marginBottom:    "16px",
          }}>
            <img src="/resawc-logo.png" alt="Resawc" style={{ width: "72px", height: "72px", objectFit: "cover" }} />
          </div>
          <h1 style={{
            fontSize:    "20px",
            fontWeight:  700,
            color:       "#111827",
            margin:      "0 0 6px",
            letterSpacing: "-0.3px",
          }}>
            Resawc CRM
          </h1>
          <p style={{ fontSize: "13.5px", color: "#6B7280", margin: 0 }}>
            Sign in to your workspace
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="email"
              style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              placeholder="you@resawc.com"
              style={inputStyle("email")}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="password"
              style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                style={{ ...inputStyle("password"), paddingRight: "42px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position:        "absolute",
                  right:           "13px",
                  top:             "50%",
                  transform:       "translateY(-50%)",
                  background:      "none",
                  border:          "none",
                  cursor:          "pointer",
                  color:           "#9CA3AF",
                  display:         "flex",
                  alignItems:      "center",
                  padding:         0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotNewPass("");
                  setForgotConfirm("");
                  setForgotErr("");
                  setForgotMsg("");
                  setShowForgot(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1A56DB",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              backgroundColor: "#FEF2F2",
              border:          "1px solid #FECACA",
              borderRadius:    "8px",
              padding:         "10px 14px",
              color:           "#DC2626",
              fontSize:        "13.5px",
              fontWeight:      500,
            }}>
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:           "100%",
              padding:         "11px",
              fontSize:        "14px",
              fontWeight:      600,
              color:           "#fff",
              backgroundColor: loading ? "#6B96E8" : "#1A56DB",
              border:          "none",
              borderRadius:    "8px",
              cursor:          loading ? "not-allowed" : "pointer",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              gap:             "8px",
              marginTop:       "4px",
              transition:      "background-color 0.15s",
              fontFamily:      "Inter, system-ui, sans-serif",
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width:           "15px",
                  height:          "15px",
                  borderRadius:    "50%",
                  border:          "2px solid rgba(255,255,255,0.35)",
                  borderTopColor:  "#fff",
                  display:         "inline-block",
                  animation:       "spin 0.75s linear infinite",
                }} />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
          alignItems: "center", justifyContent: "center", padding: "1rem"
        }}>
          <div style={{
            background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "400px",
            padding: "2rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: "1px solid #E5E7EB"
          }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
              Reset Password
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#6B7280", margin: "0 0 1.25rem" }}>
              Enter your registered Resawc email address and set a new password.
            </p>

            {forgotMsg && (
              <div style={{
                background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "6px",
                padding: "8px 12px", color: "#059669", fontSize: "0.82rem", fontWeight: 600, marginBottom: "1rem"
              }}>
                {forgotMsg}
              </div>
            )}

            {forgotErr && (
              <div style={{
                background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "6px",
                padding: "8px 12px", color: "#DC2626", fontSize: "0.82rem", fontWeight: 600, marginBottom: "1rem"
              }}>
                {forgotErr}
              </div>
            )}

            <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  Registered Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@resawc.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  New Password * (Min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={forgotNewPass}
                  onChange={(e) => setForgotNewPass(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={forgotConfirm}
                  onChange={(e) => setForgotConfirm(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  style={{
                    background: "#F3F4F6", color: "#374151", padding: "8px 14px",
                    borderRadius: "6px", border: "none", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    background: "#1A56DB", color: "#fff", padding: "8px 16px",
                    borderRadius: "6px", border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer"
                  }}
                >
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #D1D5DB; }
      `}</style>
    </main>
  );
}
