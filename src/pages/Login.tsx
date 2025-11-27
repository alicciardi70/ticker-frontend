// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

export default function Login() {
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
      // /auth/login expects form-encoded: email + password
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

      const data = await res.json(); // { access_token, token_type }
      localStorage.setItem("token", data.access_token);
      nav("/devices", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display:"grid", gap: 8 }}>
      {err && (
        <div style={{ color:"#b91c1c", background:"#fee2e2", border:"1px solid #fecaca", padding:8, borderRadius:8 }}>
          {err}
        </div>
      )}
      <div>
        <label style={{ display:"block", fontSize:12, marginBottom:4 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{ width:"100%", padding:"8px 10px", border:"1px solid #ddd", borderRadius:8 }}
        />
      </div>
      <div>
        <label style={{ display:"block", fontSize:12, marginBottom:4 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{ width:"100%", padding:"8px 10px", border:"1px solid #ddd", borderRadius:8 }}
        />
      </div>
      <button
        disabled={loading}
        style={{ padding:"10px 16px", borderRadius:8, border:"1px solid #000", background:"#000", color:"#fff", cursor:"pointer", opacity:loading?0.6:1 }}
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <div style={{ fontSize:14 }}>
        New here? <Link to="/register">Create an account</Link>
      </div>
    </form>
  );
}
