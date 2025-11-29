// src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <div style={{ 
      maxWidth: 420, 
      margin: "40px auto", 
      background: "#fff", 
      border: "1px solid #e5e7eb", 
      borderRadius: 12, 
      padding: 32, // Increased padding slightly for better spacing
      // 🚨 FONT UPGRADE
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
      color: "#0f172a"
    }}>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 800 }}>Create your account</h1>

      {err && (
        <div style={{ color: "#b91c1c", background: "#fee2e2", border: "1px solid #fecaca", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {err}
        </div>
      )}

      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Email</label>
            <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 16 }}
            />
        </div>

        <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Password</label>
            <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 16 }}
            />
        </div>

        <button
          disabled={saving}
          style={{
            padding: "12px",
            borderRadius: 8,
            background: "#111827",
            color: "#fff",
            border: "1px solid #111827",
            cursor: "pointer",
            width: "100%",
            fontSize: 16,
            fontWeight: 600,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Creating…" : "Create account"}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "#64748b" }}>
        Already have an account? <Link to="/login" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Log in</Link>
      </div>
    </div>
  );
}