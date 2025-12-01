// src/pages/ProductDetail.tsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext"; // <--- 1. Import

type Product = {
  id: string;
  slug: string;
  name: string;
  short?: string | null;
  price_cents: number;
  image_url?: string | null;
  created_at: string;
};

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast(); // <--- 2. Init Hook
  
  const [p, setP] = useState<Product | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    setErr(null);
    setLoading(true);

    const url = `${API_BASE}/products/${encodeURIComponent(id)}`;

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
            `Expected JSON but got ${ct || "unknown"}.\nFirst bytes: ${text.slice(0, 80)}`
          );
        }
        return res.json();
      })
      .then((data: Product) => setP(data))
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
      if (!p) return;
      setAdding(true);
      try {
        await addToCart(p.id); 
        // 3. USE TOAST INSTEAD OF ALERT
        toast(`Added ${p.name} to cart`); 
      } catch (e) {
        console.error(e);
        toast("Failed to add item", "error");
      } finally {
        setAdding(false);
      }
  };

  const containerStyle = {
    padding: 24,
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
  };

  if (loading) return <div style={containerStyle}>Loading…</div>;
  if (err) return (
      <div style={containerStyle}>
        <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>Error: {err}</p>
        <Link to="/" style={{ color: "#2563eb", textDecoration: "none" }}>← Back</Link>
      </div>
    );
  if (!p) return <div style={containerStyle}>Not found</div>;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f8fafc",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif"
    }}>
      <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <Link to="/" style={{ color: "#64748b", textDecoration: "none", fontWeight: 500 }}>← Back</Link>
      </div>
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
          padding: 24,
        }}
      >
        <div>
          {p.image_url && (
            <img
              src={p.image_url}
              alt={p.name}
              style={{ width: "100%", borderRadius: 12, border: "1px solid #e5e7eb" }}
            />
          )}
        </div>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8, fontWeight: 800, letterSpacing: "-0.5px" }}>{p.name}</h1>
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 20 }}>
            ${(p.price_cents / 100).toFixed(2)}
          </div>
          <p style={{ color: "#475569", marginBottom: 32, lineHeight: 1.6 }}>{p.short}</p>
          
          <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => nav(`/checkout/${p.slug ?? p.id}`)}
                style={{
                  flex: 1,
                  border: "1px solid #111",
                  background: "#111",
                  color: "#fff",
                  padding: "12px 24px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer"
                }}
              >
                Buy Now
              </button>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                style={{
                  flex: 1,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: "#111",
                  padding: "12px 24px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                  opacity: adding ? 0.7 : 1,
                  transition: "background 0.2s"
                }}
                // Add hover effect via simple inline style logic isn't perfect, 
                // but standard CSS classes would be better here.
              >
                {adding ? "Adding..." : "Add to Cart"}
              </button>
          </div>

        </div>
      </div>
    </div>
  );
}