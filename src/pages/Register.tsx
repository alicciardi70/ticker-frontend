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
      // optional: read response if you want
      // const data = await res.json();
      nav("/login", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Register failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 }}>
      <h1 style={{ marginBottom: 12 }}>Create your account</h1>

      {err && (
        <div style={{ color: "#b91c1c", background: "#fee2e2", border: "1px solid #fecaca", padding: 10, borderRadius: 8, marginBottom: 10 }}>
          {err}
        </div>
      )}

      <form onSubmit={submit}>
        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          style={{ width: "100%", padding: "10px", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 10 }}
        />

        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          style={{ width: "100%", padding: "10px", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 16 }}
        />

        <button
          disabled={saving}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            background: "#111827",
            color: "#fff",
            border: "1px solid #111827",
            cursor: "pointer",
            width: "100%",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Creating…" : "Create account"}
        </button>
      </form>

      <div style={{ marginTop: 12, textAlign: "center" }}>
        Already have an account? <Link to="/login">Log in</Link>
      </div>
    </div>
  );
}
