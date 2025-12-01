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
  discount_cents: number; // added to match Products.tsx
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

  // Use State for the token so we can clear it dynamically if it expires
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
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
      .then((r) =>
        r.ok ? r.json() : Promise.reject(`${r.status} ${r.statusText}`)
      )
      .then((data: Product[]) => {
        if (!cancelled) setProducts(data);
      })
      .catch((e) => !cancelled && setProductsErr(String(e)))
      .finally(() => !cancelled && setProductsLoading(false));

    return () => {
      cancelled = true;
    };
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
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then(async (r) => {
        // Handle 401 explicitly. If token is bad, logout immediately.
        if (r.status === 401) {
          localStorage.removeItem("token");
          if (!cancelled) {
            setToken(null); // triggers re-render -> switches UI to "Please Log In"
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

    return () => {
      cancelled = true;
    };
  }, [isUserLoggedIn, token]);

  return (
    <div
      style={{
        maxWidth: 1100, // Center content
        margin: "0 auto",
        padding: "24px 20px",
        display: "grid",
        gap: 40,
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* ---------------------------------------------------- */}
      {/* 1. PRODUCTS SECTION (Top Content)                    */}
      {/* ---------------------------------------------------- */}
      <section>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 800,
            margin: "0 0 4px 0",
            letterSpacing: "-0.5px",
          }}
        >
          Available Products
        </h2>
        <p
          style={{
            color: "#64748b",
            fontSize: 14,
            margin: "0 0 20px 0",
          }}
        >
          Browse our latest Ticker displays and kits.
        </p>

        {productsLoading && <div>Loading products…</div>}
        {productsErr && (
          <div style={{ color: "crimson", marginBottom: 12 }}>
            Failed to load products: {productsErr}
          </div>
        )}

        {!productsLoading && !productsErr && products && products.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {products.map((p) => {
              const originalPrice = p.price_cents / 100;
              const discount = (p.discount_cents || 0) / 100;
              const finalPrice = Math.max(originalPrice - discount, 0);
              const hasDiscount = p.discount_cents > 0;

              return (
                <div
                  key={p.id}
                  style={{
                    padding: 20,
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {/* Optional thumbnail if image_url is set */}
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        marginBottom: 6,
                        objectFit: "cover",
                        maxHeight: 180,
                      }}
                    />
                  )}

                  <h3
                    style={{
                      margin: "0 0 5px 0",
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                  >
                    {p.name}
                  </h3>

                  {/* Price block: final price + original + savings */}
                  <div style={{ marginBottom: 4 }}>
                    {hasDiscount ? (
                      <>
                        {/* Final (discounted) price */}
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 18,
                            color: "#16a34a",
                            marginBottom: 2,
                          }}
                        >
                          ${finalPrice.toFixed(2)}
                        </div>

                        {/* Original price, struck through */}
                        <div
                          style={{
                            fontSize: 13,
                            color: "#9ca3af",
                            textDecoration: "line-through",
                          }}
                        >
                          ${originalPrice.toFixed(2)}
                        </div>

                        {/* “You save …” line */}
                        <div
                          style={{
                            fontSize: 12,
                            color: "#16a34a",
                            fontWeight: 600,
                            marginTop: 2,
                          }}
                        >
                          You save ${discount.toFixed(2)}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#111827",
                          fontSize: 18,
                        }}
                      >
                        ${originalPrice.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Short description if present */}
                  {p.short && (
                    <p
                      style={{
                        fontSize: 14,
                        color: "#64748b",
                        margin: "4px 0 10px 0",
                      }}
                    >
                      {p.short}
                    </p>
                  )}

                  <div style={{ marginTop: "auto" }}>
                    <Link
                      to={`/products/${p.slug || p.id}`}
                      style={{
                        color: "#2563eb",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!productsLoading &&
          !productsErr &&
          products &&
          products.length === 0 && (
            <p style={{ color: "#64748b" }}>No products available yet.</p>
          )}
      </section>

      {/* ---------------------------------------------------- */}
      {/* 2. DEVICES SECTION (Bottom Content)                  */}
      {/* ---------------------------------------------------- */}
      <section>
        <h2 style={{ marginBottom: 16 }}>My Devices</h2>

        {!isUserLoggedIn && (
          <div
            style={{
              padding: 20,
              border: "1px solid #ffedd5",
              borderRadius: 8,
              background: "#fff7ed",
              color: "#9a3412",
            }}
          >
            Please{" "}
            <Link
              to="/login"
              style={{
                textDecoration: "underline",
                color: "#9a3412",
                fontWeight: 700,
              }}
            >
              Log In
            </Link>{" "}
            to view and manage your connected Ticker devices.
          </div>
        )}

        {isUserLoggedIn && devicesLoading && <div>Loading devices…</div>}

        {isUserLoggedIn && devicesErr && (
          <div style={{ color: "crimson", marginBottom: 12 }}>
            Failed to load devices: {devicesErr}
          </div>
        )}

        {isUserLoggedIn && !devicesLoading && !devicesErr && (
          devices && devices.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 16,
              }}
            >
              {devices.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: 16,
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{d.name}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    Device ID: {d.controller_id}
                  </div>

                  <Link
                    to={`/devices/${d.id}/config`}
                    style={{
                      marginTop: 10,
                      display: "inline-block",
                      color: "#111827",
                      fontWeight: 600,
                    }}
                  >
                    Configure Device →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 20,
                border: "1px solid #dbeafe",
                borderRadius: 8,
                background: "#eff6ff",
                color: "#1e40af",
              }}
            >
              You have no devices registered yet.
              <Link
                to="/devices"
                style={{ marginLeft: 8, fontWeight: 600 }}
              >
                Add your first device.
              </Link>
            </div>
          )
        )}
      </section>
    </div>
  );
}
