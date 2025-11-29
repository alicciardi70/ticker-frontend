// src/pages/Login.tsx (DROP-IN REPLACEMENT WITH FONT FIX)

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

// Define props interface for the component
interface LoginProps {
    onLoginSuccess?: () => void;
}

// Styles to match the rest of the modern app
const styles = {
    // Shared color and font variables
    primary: "#111827",
    errorBg: "#fee2e2",
    errorText: "#b91c1c",
    errorBorder: "#fecaca",
    borderColor: "#e5e7eb",

    // Card and Form container
    wrapper: {
        // FIX: Removed "60px auto" margin because this component is rendered inside a grid layout on Home.tsx
        // If rendered standalone, the parent component handles centering.
        maxWidth: 420,
        margin: "0", 
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24, 
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
        // 🚨 FONT FIX: Use a more robust, modern system font stack
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
        color: "#0f172a", 
    },
    // Standard button primary
    button: {
        padding: "10px 16px",
        borderRadius: 8,
        background: "#111827",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        width: "100%",
        fontWeight: 600,
        transition: "opacity 0.15s",
        fontSize: 15,
    },
    // Input styling
    input: {
        width: "100%",
        padding: "10px",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        marginBottom: 10,
        outline: "none",
        transition: "border-color 0.15s",
        fontSize: 15,
    },
    // Error styling
    error: {
        color: "#b91c1c",
        background: "#fee2e2",
        border: "1px solid #fecaca",
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14,
    },
    label: {
        display: "block",
        fontSize: 14,
        marginBottom: 4,
        color: "#374151",
        fontWeight: 500,
    }
};

export default function Login({ onLoginSuccess }: LoginProps) { 
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      
      if (onLoginSuccess) {
          onLoginSuccess();
      }
      
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
        {err && (
          <div style={styles.error}>
            {err}
          </div>
        )}
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
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={styles.input}
          />
        </div>
        
        {/* Forgot Password Link */}
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