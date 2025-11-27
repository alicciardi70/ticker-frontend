// src/pages/ProductDetail.tsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

export default function ProductDetail() {
  const { id } = useParams(); // slug or UUID
  const nav = useNavigate();
  const [p, setP] = useState<Product | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (err)
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>Error: {err}</p>
        <Link to="/">Back</Link>
      </div>
    );
  if (!p) return <div style={{ padding: 24 }}>Not found</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <Link to="/">← Back</Link>
      </div>
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
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
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>{p.name}</h1>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>
            ${(p.price_cents / 100).toFixed(2)}
          </div>
          <p style={{ color: "#475569", marginBottom: 16 }}>{p.short}</p>
          <button
            onClick={() => nav(`/checkout/${p.slug ?? p.id}`)}
            style={{
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 8,
            }}
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  );
}



