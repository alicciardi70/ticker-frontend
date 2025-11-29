// src/pages/Login.tsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

interface LoginProps {
    onLoginSuccess?: () => void;
}

const styles = {
    primary: "#111827",
    wrapper: {
        maxWidth: 420,
        margin: "0", 
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24, 
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
        color: "#0f172a", 
    },
    button: {
        padding: "10px 16px",
        borderRadius: 8,
        background: "#111827",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        width: "100%",
        fontWeight: 600,
        fontSize: 15,
    },
    input: {
        width: "100%",
        padding: "10px",
        paddingRight: "40px", // Extra padding for the eye icon
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        outline: "none",
        fontSize: 15,
        boxSizing: "border-box" as const,
    },
    label: {
        display: "block",
        fontSize: 14,
        marginBottom: 6,
        color: "#374151",
        fontWeight: 600,
    },
    error: {
        color: "#b91c1c",
        background: "#fee2e2",
        border: "1px solid #fecaca",
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14,
    },
    eyeBtn: {
        position: "absolute" as const,
        right: 10,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#6b7280",
        padding: 4,
        display: "flex",
        alignItems: "center",
    }
};

// Simple SVG Icons
const EyeIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
  </svg>
);

export default function Login({ onLoginSuccess }: LoginProps) { 
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // New State
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.set("email", email.trim().toLowerCase());
      body.set("password", password);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        credentials: "omit",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid email or password");
        throw new Error(`Login failed: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      localStorage.setItem("token", data.access_token);
      
      if (onLoginSuccess) onLoginSuccess();
      nav("/devices", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 700, textAlign: "center" }}>Sign in to Ticker.ink</h1>

      <form onSubmit={onSubmit} style={{ display:"grid", gap: 16 }}>
        {err && <div style={styles.error}>{err}</div>}
        
        <div>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            autoComplete="email"
            style={styles.input}
          />
        </div>

        <div>
          <label style={styles.label}>Password</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={styles.input}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              tabIndex={-1} // Skip tab focusing
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>
        
        <div style={{ textAlign: "right", marginTop: -8, marginBottom: 4 }}>
            <Link to="/forgot" style={{ color: styles.primary, fontSize: 14, textDecoration: "none" }}>
                Forgot Password?
            </Link>
        </div>

        <button
          disabled={loading}
          style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
        New here? <Link to="/register" style={{ color: styles.primary, fontWeight: 500 }}>Create an account</Link>
      </div>
    </div>
  );
}