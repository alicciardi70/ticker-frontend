import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";

type Product = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_url?: string | null;
  short?: string | null;
};

export default function Checkout() {
  const { id } = useParams();           // expects product id (or slug if your backend supports it)
  const nav = useNavigate();
  const [p, setP] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState("");
  const [shipName, setShipName] = useState("");
  const [shipAddress, setShipAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    fetch(`${API_BASE}/products/${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("application/json")) throw new Error("Expected JSON from backend");
        return r.json();
      })
      .then((data: Product) => setP(data))
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!p) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          ship_name: shipName || null,
          ship_address: shipAddress || null,
          items: [{ product_id: p.id, qty }],
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Order failed: ${res.status}`);
      }
      const order = await res.json(); // { id, ... }
      nav(`/order/${order.id}`, { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Order failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (err) return <div style={{ padding: 24, color: "crimson" }}>Error: {err}</div>;
  if (!p) return <div style={{ padding: 24 }}>Not found</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <Link to="/">← Back</Link>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: "100%", borderRadius: 12, border: "1px solid #e5e7eb" }} />}
          <h1 style={{ marginTop: 12 }}>{p.name}</h1>
          <div style={{ fontWeight: 700 }}>${(p.price_cents / 100).toFixed(2)}</div>
          {p.short && <p style={{ color: "#475569", marginTop: 8 }}>{p.short}</p>}
        </div>

        <form onSubmit={placeOrder} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <h2 style={{ marginBottom: 12 }}>Checkout</h2>

          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Email</label>
          <input required value={email} onChange={e=>setEmail(e.target.value)}
                 style={{ width:"100%", padding:"10px", border:"1px solid #e5e7eb", borderRadius: 8, marginBottom: 10 }} />

          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Ship To (Name)</label>
          <input value={shipName} onChange={e=>setShipName(e.target.value)}
                 style={{ width:"100%", padding:"10px", border:"1px solid #e5e7eb", borderRadius: 8, marginBottom: 10 }} />

          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Address</label>
          <textarea value={shipAddress} onChange={e=>setShipAddress(e.target.value)}
                    rows={3}
                    style={{ width:"100%", padding:"10px", border:"1px solid #e5e7eb", borderRadius: 8, marginBottom: 10 }} />

          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Quantity</label>
          <input type="number" min={1} value={qty} onChange={e=>setQty(Math.max(1, Number(e.target.value)))}
                 style={{ width: 120, padding:"10px", border:"1px solid #e5e7eb", borderRadius: 8, marginBottom: 16 }} />

          {err && <div style={{ color:"#b91c1c", background:"#fee2e2", border:"1px solid #fecaca", padding: 10, borderRadius: 8, marginBottom: 10 }}>{err}</div>}

          <button disabled={saving}
                  style={{ padding:"10px 16px", borderRadius: 8, background:"#111827", color:"#fff", border:"1px solid #111827", cursor:"pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Placing…" : "Place order"}
          </button>
        </form>
      </div>
    </div>
  );
}
