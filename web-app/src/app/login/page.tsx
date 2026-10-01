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
            width:           "52px",
            height:          "52px",
            borderRadius:    "14px",
            backgroundColor: "#1A56DB",
            marginBottom:    "16px",
            fontWeight:      800,
            fontSize:        "22px",
            color:           "#fff",
            letterSpacing:   "-1px",
          }}>
            R
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

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #D1D5DB; }
      `}</style>
    </main>
  );
}
