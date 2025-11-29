// src/pages/Home.tsx

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";

// --- TYPE DEFINITIONS ---
type Product = {
  id: string;
  slug: string;
  name: string;
  short?: string | null;
  price_cents: number;
  image_url?: string | null;
  created_at: string;
};

type Device = {
    id: string;
    name: string;
    controller_id: string;
    firmware_version: string | null;
    created_at: string;
};
// ------------------------


export default function Home() {
  const nav = useNavigate();
  
  // FIX 1: Use State for the token so we can clear it dynamically if it expires
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const isUserLoggedIn = !!token;
  
  // State for Products
  const [products, setProducts] = useState<Product[] | null>(null);
  const [productsErr, setProductsErr] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  
  // State for Devices
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [devicesErr, setDevicesErr] = useState<string | null>(null);
  const [devicesLoading, setDevicesLoading] = useState(isUserLoggedIn);


  // 1. Fetch Products (Unauthenticated)
  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    setProductsErr(null);

    fetch(`${API_BASE}/products`)
      .then((r) => (r.ok ? r.json() : Promise.reject(`${r.status} ${r.statusText}`)))
      .then((data: Product[]) => !cancelled && setProducts(data))
      .catch((e) => !cancelled && setProductsErr(String(e)))
      .finally(() => !cancelled && setProductsLoading(false));

    return () => { cancelled = true; };
  }, []);

  // 2. Fetch Devices (Authenticated - Only runs if user is logged in)
  useEffect(() => {
    if (!isUserLoggedIn) {
        setDevicesLoading(false);
        return;
    }

    let cancelled = false;
    setDevicesLoading(true);
    setDevicesErr(null);

    fetch(`${API_BASE}/devices/`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
      .then(async (r) => {
        // FIX 2: Handle 401 explicitly. If token is bad, logout immediately.
        if (r.status === 401) {
            localStorage.removeItem("token");
            if (!cancelled) {
                setToken(null); // This triggers re-render -> switches UI to "Please Log In"
                setDevicesLoading(false);
            }
            return null; // Stop processing
        }
        
        if (r.ok) return r.json();
        return Promise.reject(`${r.status} ${r.statusText}`);
      })
      .then((data: Device[] | null) => {
          if (!cancelled && data) setDevices(data);
      })
      .catch((e) => !cancelled && setDevicesErr(String(e)))
      .finally(() => !cancelled && setDevicesLoading(false));

    return () => { cancelled = true; };
  }, [isUserLoggedIn, token]); 


  return (
    <div
      style={{
        maxWidth: 1100, // Center content
        margin: "0 auto",
        padding: "24px 20px",
        display: "grid",
        gap: 40, 
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
      }}
    >
      {/* ---------------------------------------------------- */}
      {/* 1. PRODUCTS SECTION (Top Content)                    */}
      {/* ---------------------------------------------------- */}
      <section>
        <h2 style={{ marginBottom: 16 }}>Available Products</h2>
        
        {productsLoading && <div>Loading products…</div>}
        {productsErr && (
          <div style={{ color: "crimson", marginBottom: 12 }}>
            Failed to load products: {productsErr}
          </div>
        )}

        {!productsLoading && !productsErr && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))",
              gap: 16,
            }}
          >
            {(products ?? []).map((p) => (
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
                
                <Link to={`/products/${encodeURIComponent(p.slug || p.id)}`}>
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
      </section>

      {/* ---------------------------------------------------- */}
      {/* 2. DEVICES SECTION (Bottom Content)                   */}
      {/* ---------------------------------------------------- */}
      <section>
        <h2 style={{ marginBottom: 16 }}>My Devices</h2>

        {!isUserLoggedIn && (
            <div style={{ padding: 20, border: "1px solid #ffedd5", borderRadius: 8, background: "#fff7ed", color: "#9a3412" }}>
                Please <Link to="/login" style={{ textDecoration: 'underline', color: '#9a3412', fontWeight: 700 }}>Log In</Link> to view and manage your connected Ticker devices.
            </div>
        )}

        {isUserLoggedIn && devicesLoading && <div>Loading devices…</div>}
        
        {isUserLoggedIn && devicesErr && (
            <div style={{ color: "crimson", marginBottom: 12 }}>
                Failed to load devices: {devicesErr}
            </div>
        )}

        {isUserLoggedIn && !devicesLoading && !devicesErr && (
            (devices && devices.length > 0) ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 16 }}>
                    {devices.map((d) => (
                        <div key={d.id} style={{ 
                            padding: 16, 
                            border: "1px solid #e5e7eb", 
                            borderRadius: 8, 
                            background: "#fff"
                        }}>
                            <div style={{ fontWeight: 700, fontSize: 18 }}>{d.name}</div>
                            <div style={{ color: "#6b7280", fontSize: 12 }}>Device ID: {d.controller_id}</div>
                            
                            <Link 
                                to={`/devices/${d.id}/config`} 
                                style={{ marginTop: 10, display: 'inline-block', color: '#111827', fontWeight: 600 }}>
                                Configure Device →
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: 20, border: "1px solid #dbeafe", borderRadius: 8, background: "#eff6ff", color: "#1e40af" }}>
                    You have no devices registered yet.
                    <Link to="/devices" style={{ marginLeft: 8, fontWeight: 600 }}>Add your first device.</Link>
                </div>
            )
        )}
      </section>
    </div>
  );
}