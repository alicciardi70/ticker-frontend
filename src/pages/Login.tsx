// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

interface LoginProps {
    onLoginSuccess?: () => void;
}

// Dark Mode Styles
const styles = {
    wrapper: { 
        maxWidth: 420, 
        margin: "40px auto", // <--- FIXED CENTERING
        background: "#111",  // Dark Card
        border: "1px solid #333", 
        borderRadius: 12, 
        padding: 32, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)", 
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif", 
        color: "#fff" 
    },
    button: { 
        padding: "12px 16px", 
        borderRadius: 8, 
        background: "#00ff41", // Neon Green
        color: "#000",         // Black Text
        border: "none", 
        cursor: "pointer", 
        width: "100%", 
        fontWeight: 700, 
        fontSize: 16,
        transition: "opacity 0.2s"
    },
    input: { 
        width: "100%", 
        padding: "12px", 
        paddingRight: "40px", 
        background: "#0a0a0a", // Darker Input
        border: "1px solid #333", 
        color: "#fff",
        borderRadius: 8, 
        outline: "none", 
        fontSize: 15, 
        boxSizing: "border-box" as const 
    },
    label: { 
        display: "block", 
        fontSize: 14, 
        marginBottom: 8, 
        color: "#888", // Muted Label
        fontWeight: 600,
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em"
    },
    error: { 
        color: "#ef4444", 
        background: "rgba(239, 68, 68, 0.1)", 
        border: "1px solid #ef4444", 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 20, 
        fontSize: 14 
    },
    eyeBtn: { 
        position: "absolute" as const, 
        right: 12, 
        top: "50%", 
        transform: "translateY(-50%)", 
        background: "none", 
        border: "none", 
        cursor: "pointer", 
        color: "#666", 
        padding: 4, 
        display: "flex", 
        alignItems: "center" 
    },
    link: {
        color: "#fff",
        textDecoration: "underline",
        fontSize: 14
    }
};

const EyeIcon = () => (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = () => (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>);

export default function Login({ onLoginSuccess }: LoginProps) { 
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

      const guestId = localStorage.getItem("ticker_guest_id");

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
            ...(guestId ? { "X-Guest-ID": guestId } : {}) 
        },
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
      <h1 style={{ marginBottom: 32, fontSize: 24, fontWeight: 900, textAlign: "center", letterSpacing: "-0.5px" }}>
        Sign in to Ticker.ink
      </h1>
      
      <form onSubmit={onSubmit} style={{ display:"grid", gap: 20 }}>
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
            onFocus={(e) => e.target.style.borderColor = "#00ff41"}
            onBlur={(e) => e.target.style.borderColor = "#333"}
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
                onFocus={(e) => e.target.style.borderColor = "#00ff41"}
                onBlur={(e) => e.target.style.borderColor = "#333"}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn} tabIndex={-1}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
          </div>
        </div>

        <div style={{ textAlign: "right", marginTop: -8 }}>
            <Link to="/forgot" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>Forgot Password?</Link>
        </div>

        <button disabled={loading} style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div style={{ marginTop: 32, textAlign: "center", fontSize: 14, color: "#666" }}>
        New here? <Link to="/register" style={{ color: "#00ff41", fontWeight: 600, textDecoration: "none" }}>Create an account</Link>
      </div>
    </div>
  );
}