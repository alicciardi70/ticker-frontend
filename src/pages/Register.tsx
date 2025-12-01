// src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";

const EyeIcon = () => (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = () => (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>);

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
      // --- NEW: Get Guest ID ---
      const guestId = localStorage.getItem("ticker_guest_id");

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            // --- NEW: Attach Header ---
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
    <div style={{ maxWidth: 420, margin: "40px auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 32, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif", color: "#0f172a" }}>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 800 }}>Create your account</h1>
      {err && <div style={{ color: "#b91c1c", background: "#fee2e2", border: "1px solid #fecaca", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{err}</div>}
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 16, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Password</label>
            <div style={{ position: "relative" }}>
                <input value={password} onChange={(e) => setPassword(e.target.value)} required type={showPassword ? "text" : "password"} style={{ width: "100%", padding: "10px 12px", paddingRight: "40px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 16, boxSizing: "border-box" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4, display: "flex", alignItems: "center" }} tabIndex={-1}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
            </div>
        </div>
        <button disabled={saving} style={{ padding: "12px", borderRadius: 8, background: "#111827", color: "#fff", border: "1px solid #111827", cursor: "pointer", width: "100%", fontSize: 16, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>{saving ? "Creating…" : "Create account"}</button>
      </form>
      <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "#64748b" }}>Already have an account? <Link to="/login" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Log in</Link></div>
    </div>
  );
}