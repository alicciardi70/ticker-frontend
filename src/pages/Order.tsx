// src/pages/Order.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { useCart } from "../context/CartContext";

type OrderItem = {
    product_name: string;
    qty: number;
    unit_price_cents: number;
};

type OrderStatus = {
  order_id: string;
  friendly_id?: string;
  derived_status: string;
  total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  ship_name: string;
  ship_address: string;
  items: OrderItem[];
  created_at?: string;
};

export default function OrderPage() {
  const { id } = useParams();
  const { refreshCart } = useCart();
  
  const [data, setData] = useState<OrderStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Format currency helper
  const fmt = (cents: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  useEffect(() => {
    if (!id) return;

    // Handle Stripe Return Logic
    if (id.startsWith("cs_")) {
       setLoading(true);
       fetch(`${API_BASE}/payments/sync-order/${id}`, { method: 'POST' })
         .then(r => r.ok ? r.json() : Promise.reject("Sync failed"))
         .then(syncData => {
            // Only refresh ONCE upon successful sync
            refreshCart(); 
            
            window.history.replaceState(null, "", `/#/order/${syncData.order_id}`);
            return fetch(`${API_BASE}/orders/${syncData.order_id}/status`);
         })
         .then(r => r.json())
         .then(setData)
         .catch(e => setErr("Could not verify payment."))
         .finally(() => setLoading(false));
       return;
    }

    setLoading(true);
    fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/status`)
      .then(async r => r.ok ? r.json() : Promise.reject(await r.text()))
      .then(setData)
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); 

  if (loading) return <div style={{padding:40, textAlign:'center'}}>Loading Receipt...</div>;
  if (err) return <div style={{padding:40, color:'crimson'}}>Error: {err}</div>;
  if (!data) return <div style={{padding:40}}>Order not found</div>;

  return (
    <div style={{ padding: "40px 20px", maxWidth: 600, margin: "0 auto", fontFamily: "Inter, system-ui, sans-serif", color: "#0f172a" }}>
      <Link to="/" style={{ color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>← Back Home</Link>
      
      <div style={{ marginTop: 20, background: "white", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          
          <div style={{ background: "#f8fafc", padding: "32px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h1 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 800 }}>Order Confirmed!</h1>
              <p style={{ margin: 0, color: "#64748b" }}>Thank you for your purchase.</p>
          </div>

          <div style={{ padding: "32px" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, fontSize: 14 }}>
                  <div>
                      <div style={{ color: "#64748b", marginBottom: 4 }}>Order Number</div>
                      <div style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 16 }}>
                          #{data.friendly_id || data.order_id.slice(0, 8).toUpperCase()}
                      </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#64748b", marginBottom: 4 }}>Status</div>
                      <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 99, fontWeight: 700, textTransform: "capitalize" }}>
                          {data.derived_status}
                      </span>
                  </div>
              </div>

              <hr style={{ border: "0", borderTop: "1px solid #f1f5f9", margin: "24px 0" }} />

              {/* ITEMS */}
              <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 16, letterSpacing: '0.05em' }}>Items</h3>
                  {data.items?.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 14 }}>
                          <div>
                              <span style={{ fontWeight: 600, marginRight: 8 }}>{item.qty}x</span> 
                              {item.product_name}
                          </div>
                          <div>{fmt(item.unit_price_cents * item.qty)}</div>
                      </div>
                  ))}
              </div>

              <hr style={{ border: "0", borderTop: "1px solid #f1f5f9", margin: "24px 0" }} />

              {/* SUMMARY */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                      <span>Subtotal</span>
                      <span>{fmt(data.subtotal_cents || data.total_cents)}</span>
                  </div>
                  {data.tax_cents > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                          <span>Sales Tax</span>
                          <span>{fmt(data.tax_cents)}</span>
                      </div>
                  )}
                  {data.shipping_cents > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                          <span>Shipping</span>
                          <span>{fmt(data.shipping_cents)}</span>
                      </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 20, marginTop: 12, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                      <span>Total</span>
                      <span>{fmt(data.total_cents)}</span>
                  </div>
              </div>

              <hr style={{ border: "0", borderTop: "1px solid #f1f5f9", margin: "24px 0" }} />

              {/* ADDRESS */}
              <div style={{ fontSize: 14 }}>
                  <div style={{ color: "#64748b", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.05em" }}>Shipping To</div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{data.ship_name}</div>
                  <div style={{ color: "#334155", marginTop: 4, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {data.ship_address}
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
}