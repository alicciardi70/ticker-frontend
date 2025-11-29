// src/pages/Home.tsx (DROP-IN REPLACEMENT)

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./Login";
import { API_BASE } from "../lib/api";

type Product = {
  id: string;
  slug: string;
  name: string;
  short?: string | null;
  price_cents: number;
  image_url?: string | null;
  created_at: string;
};

export default function Home() {
  const nav = useNavigate();
  
  // 🚨 FIX 1: Use state to hold the token so the component can re-render
  const [token, setToken] = useState(typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const [items, setItems] = useState<Product[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🚨 FIX 2: Callback function to update the token state after successful login
  function handleLoginSuccess() {
    // Read the newly saved token from local storage and update state
    setToken(localStorage.getItem("token"));
  }

  function logout() {
    localStorage.removeItem("token");
    // 🚨 FIX 3: Clear the state token as well
    setToken(null); 
    nav("/", { replace: true });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);

    fetch(`${API_BASE}/products`)
      .then((r) => (r.ok ? r.json() : Promise.reject(`${r.status} ${r.statusText}`)))
      .then((data: Product[]) => !cancelled && setItems(data))
      .catch((e) => !cancelled && setErr(String(e)))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(280px, 360px) 1fr",
        gap: 24,
      }}
    >
      {/* Left: Login or Signed-in panel */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
        }}
      >
        {token ? (
          <div>
            <h2 style={{ marginBottom: 8 }}>Welcome back 👋</h2>
            <p style={{ color: "#6b7280", marginBottom: 16 }}>
              You’re signed in. Manage your devices or continue shopping.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/devices">
                <button
                  style={{
                    border: "1px solid #111",
                    background: "#111",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Go to Devices
                </button>
              </Link>
              <button
                onClick={logout}
                style={{
                  border: "1px solid #e11d48",
                  background: "#fff",
                  color: "#e11d48",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Log out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: 8 }}>Sign in</h2>
            <p style={{ color: "#6b7280", marginBottom: 16 }}>
              Use your email and password to access devices and orders.
            </p>
            {/* 🚨 FIX 4: Pass the success callback function to the Login component */}
            <Login onLoginSuccess={handleLoginSuccess} />
          </div>
        )}
      </div>

      {/* Right: Products grid */}
      <div>
        <h2 style={{ marginBottom: 12 }}>Products</h2>
        {loading && <div>Loading products…</div>}
        {err && (
          <div style={{ color: "crimson", marginBottom: 12 }}>
            Failed to load products: {err}
          </div>
        )}
        {!loading && !err && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))",
              gap: 16,
            }}
          >
            {(items ?? []).map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{
                      width: "100%",
                      height: 140,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                )}
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ color: "#475569" }}>{p.short}</div>
                <div style={{ fontWeight: 600 }}>
                  ${(p.price_cents / 100).toFixed(2)}
                </div>
                <Link to={`/product/${encodeURIComponent(p.slug || p.id)}`}>
                  <button
                    style={{
                      border: "1px solid #111",
                      background: "#111",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      width: "100%",
                    }}
                  >
                    View
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}