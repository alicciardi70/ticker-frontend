// src/pages/ProductDetail.tsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

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

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
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
          throw new Error(`HTTP ${res.status}`);
        }
        if (!ct.includes("application/json")) {
          throw new Error("Expected JSON");
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
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: '#fff',
    maxWidth: 1100,
    margin: "0 auto"
  };

  if (loading) return <div style={containerStyle}>Loading…</div>;
  if (err) return (
      <div style={containerStyle}>
        <p style={{ color: "#ef4444" }}>Error: {err}</p>
        <Link to="/products" style={{ color: "#fff", textDecoration: "underline" }}>← Back to Products</Link>
      </div>
    );
  if (!p) return <div style={containerStyle}>Product not found</div>;

  const originalPrice = p.price_cents / 100;
  const discount = (p.discount_cents || 0) / 100;
  const finalPrice = Math.max(originalPrice - discount, 0);
  const hasDiscount = p.discount_cents > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      
      {/* Top Bar */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #333", background: "#000" }}>
        <Link to="/products" style={{ color: "#888", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
            ← Back to Products
        </Link>
      </div>

      <div
        style={{
          maxWidth: 1000,
          margin: "40px auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", // Responsive stack
          gap: 48,
          padding: 24,
        }}
      >
        {/* Left Column: Image */}
        <div>
          {p.image_url && (
            <div style={{ border: "1px solid #333", borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                <img
                src={p.image_url}
                alt={p.name}
                style={{ width: "100%", display: "block" }}
                />
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div>
          <h1 style={{ fontSize: 32, marginBottom: 12, fontWeight: 800, color: '#fff', letterSpacing: "-1px" }}>
            {p.name}
          </h1>

          <div style={{ marginBottom: 24 }}>
            {hasDiscount ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontWeight: 800, fontSize: 28, color: "#fff" }}>
                        ${finalPrice.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 18, color: "#666", textDecoration: "line-through" }}>
                        ${originalPrice.toFixed(2)}
                    </span>
                </div>
                <div style={{ fontSize: 14, color: "#00ff41", fontWeight: 600, marginTop: 4 }}>
                  You save ${discount.toFixed(2)}
                </div>
              </>
            ) : (
              <div style={{ fontWeight: 800, fontSize: 28, color: "#fff" }}>
                ${originalPrice.toFixed(2)}
              </div>
            )}
          </div>

          <p style={{ color: "#ccc", marginBottom: 40, lineHeight: 1.6, fontSize: 16 }}>
            {p.short || "No description available."}
          </p>
          
          <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
              <button
                onClick={() => nav(`/checkout/${p.slug ?? p.id}`)}
                style={{
                  width: "100%",
                  border: "none",
                  background: "#00ff41", // Neon Green
                  color: "#000",         // Black Text
                  padding: "16px 24px",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                Buy Now
              </button>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                style={{
                  width: "100%",
                  border: "1px solid #333",
                  background: "transparent",
                  color: "#fff",
                  padding: "16px 24px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                  opacity: adding ? 0.6 : 1,
                  transition: "all 0.2s"
                }}
              >
                {adding ? "Adding..." : "Add to Cart"}
              </button>
          </div>

        </div>
      </div>
    </div>
  );
}