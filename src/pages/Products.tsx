// src/pages/Products.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

type Product = {
  id: string;
  slug: string;
  name: string;
  short?: string | null;
  price_cents: number;
  discount_cents: number;
  image_url?: string | null;
  created_at: string;
};

// Dark Mode Styles
const styles = {
  container: {
    maxWidth: 1100,
    margin: "40px auto",
    padding: "0 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#fff",
  } as React.CSSProperties,
  title: {
    fontSize: 32,
    fontWeight: 900,
    margin: "0 0 8px 0",
    letterSpacing: "-1px",
    color: "#fff",
  } as React.CSSProperties,
  subtitle: {
    color: "#888",
    fontSize: 16,
    marginBottom: 40,
  } as React.CSSProperties,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);

    const url = `${API_BASE}/products`;

    fetch(url)
      .then(async (res) => {
        const ct = res.headers.get("content-type") || "";
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
        }
        if (!ct.includes("application/json")) {
          throw new Error("Expected JSON response");
        }
        return res.json();
      })
      .then((data: Product[]) => {
        setProducts(data);
      })
      .catch((e) => {
        console.error(e);
        setErr(String(e));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: "#666" }}>Loading products…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.container}>
        <p style={{ color: "#ef4444", whiteSpace: "pre-wrap" }}>Error: {err}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>All Ticker Products</h1>
      <p style={styles.subtitle}>
        Browse our available physical ticker displays and kits.
      </p>

      {/* Responsive Grid Layout */}
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
                border: "1px solid #333",
                borderRadius: 12,
                background: "#111", // Dark card background
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "transform 0.2s ease, border-color 0.2s ease",
              }}
              // Simple hover effect logic would ideally use CSS classes, 
              // but inline styles work for structure.
            >
              {/* Thumbnail */}
              {p.image_url && (
                <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', border: '1px solid #222' }}>
                    <img
                    src={p.image_url}
                    alt={p.name}
                    style={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                        display: "block"
                    }}
                    />
                </div>
              )}

              <div>
                <h3
                    style={{
                    margin: "0 0 6px 0",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#fff"
                    }}
                >
                    {p.name}
                </h3>

                {/* Price block */}
                <div>
                    {hasDiscount ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 18, color: "#fff" }}>
                                ${finalPrice.toFixed(2)}
                            </span>
                            <span style={{ fontSize: 14, color: "#666", textDecoration: "line-through" }}>
                                ${originalPrice.toFixed(2)}
                            </span>
                        </div>
                        <div style={{ fontSize: 12, color: "#00ff41", fontWeight: 600, marginTop: 4 }}>
                            Save ${discount.toFixed(2)}
                        </div>
                    </>
                    ) : (
                    <div style={{ fontWeight: 600, color: "#fff", fontSize: 18 }}>
                        ${originalPrice.toFixed(2)}
                    </div>
                    )}
                </div>
              </div>

              {/* Short description */}
              {p.short && (
                <p style={{ fontSize: 14, color: "#888", margin: 0, lineHeight: 1.5 }}>
                  {p.short}
                </p>
              )}

              <div style={{ marginTop: "auto", paddingTop: 12 }}>
                <Link
                  to={`/products/${p.slug}`}
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: "transparent",
                    border: "1px solid #333",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 600,
                    padding: "10px",
                    borderRadius: 8,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#00ff41";
                      e.currentTarget.style.color = "#00ff41";
                  }}
                  onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#333";
                      e.currentTarget.style.color = "#fff";
                  }}
                >
                  View Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}