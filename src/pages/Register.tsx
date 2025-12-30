// src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";

const EyeIcon = () => (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = () => (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>);

// Reuse Dark Styles
const styles = {
    wrapper: { 
        maxWidth: 420, 
        margin: "40px auto", 
        background: "#111", 
        border: "1px solid #333", 
        borderRadius: 12, 
        padding: 32, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)", 
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif", 
        color: "#fff" 
    },
    input: { 
        width: "100%", 
        padding: "12px", 
        background: "#0a0a0a", 
        border: "1px solid #333", 
        color: "#fff",
        borderRadius: 8, 
        fontSize: 16, 
        boxSizing: "border-box" as const 
    },
    label: { 
        display: "block", 
        fontSize: 14, 
        fontWeight: 600, 
        marginBottom: 8, 
        color: "#888",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em"
    },
    button: {
        padding: "12px", 
        borderRadius: 8, 
        background: "#00ff41", 
        color: "#000", 
        border: "none", 
        cursor: "pointer", 
        width: "100%", 
        fontSize: 16, 
        fontWeight: 700,
        marginTop: 8
    }
};

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const guestId = localStorage.getItem("ticker_guest_id");

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            ...(guestId ? { "X-Guest-ID": guestId } : {}) 
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Register failed (${res.status})`);
      }
      nav("/login", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Register failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <h1 style={{ marginBottom: 32, fontSize: 24, fontWeight: 900, textAlign: "center", letterSpacing: "-0.5px" }}>
        Create Account
      </h1>
      
      {err && <div style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{err}</div>}
      
      <form onSubmit={submit}>
        <div style={{ marginBottom: 20 }}>
            <label style={styles.label}>Email</label>
            <input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                type="email" 
                style={styles.input} 
                onFocus={(e) => e.target.style.borderColor = "#00ff41"}
                onBlur={(e) => e.target.style.borderColor = "#333"}
            />
        </div>
        <div style={{ marginBottom: 24 }}>
            <label style={styles.label}>Password</label>
            <div style={{ position: "relative" }}>
                <input 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    type={showPassword ? "text" : "password"} 
                    style={{ ...styles.input, paddingRight: "40px" }} 
                    onFocus={(e) => e.target.style.borderColor = "#00ff41"}
                    onBlur={(e) => e.target.style.borderColor = "#333"}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#666", padding: 4, display: "flex", alignItems: "center" }} tabIndex={-1}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
            </div>
        </div>
        <button disabled={saving} style={{ ...styles.button, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Creating..." : "Create Account"}
        </button>
      </form>
      <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "#666" }}>
        Already have an account? <Link to="/login" style={{ color: "#00ff41", fontWeight: 600, textDecoration: "none" }}>Log in</Link>
      </div>
    </div>
  );
}