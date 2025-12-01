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

// Standard styles copied from Account/Login for consistency
const styles = {
  container: {
    maxWidth: 1100,
    margin: "40px auto",
    padding: "0 20px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#0f172a",
  } as React.CSSProperties,
  title: {
    fontSize: 32,
    fontWeight: 800,
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px",
  } as React.CSSProperties,
  subtitle: {
    color: "#64748b",
    fontSize: 16,
    marginBottom: 30,
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
          const text = await res.text().catch(() => "");
          throw new Error(
            `Expected JSON but got ${ct || "unknown"}.\nFirst bytes: ${text.slice(
              0,
              80
            )}`
          );
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
        <p>Loading products…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div style={styles.container}>
        <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>Error: {err}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>All Ticker Products</h1>
      <p style={styles.subtitle}>
        Browse our available physical ticker displays and kits.
      </p>

      {/* Simple Responsive Grid Layout */}
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
              {/* Optional thumbnail if you set image_url */}
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
                  to={`/products/${p.slug}`}
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
    </div>
  );
}
