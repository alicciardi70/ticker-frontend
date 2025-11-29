// src/pages/Order.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

type OrderStatus = {
  order_id: string;
  derived_status: string;
  paid: boolean;
  shipped: boolean;
  delivered: boolean;
  cancelled: boolean;
  returned: boolean;
  total_cents: number;
  created_at?: string;
};

export default function OrderPage() {
  const { id } = useParams();
  const [data, setData] = useState<OrderStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // ---------------------------------------------------------
    // CRITICAL FIX: DETECT STRIPE ID AND SYNC FIRST
    // ---------------------------------------------------------
    if (id.startsWith("cs_")) {
       setLoading(true);
       // 1. Call the Sync Endpoint
       fetch(`${API_BASE}/payments/sync-order/${id}`, { method: 'POST' })
         .then(r => {
             if (!r.ok) throw new Error("Payment sync failed");
             return r.json();
         })
         .then(syncData => {
            // 2. Success! We got the REAL Order UUID.
            
            // Update the URL in the browser so the user doesn't see "cs_test..." anymore
            window.history.replaceState(null, "", `/#/order/${syncData.order_id}`);
            
            // 3. Now fetch the actual order data using the REAL UUID
            return fetch(`${API_BASE}/orders/${syncData.order_id}/status`);
         })
         .then(r => r.json())
         .then(orderData => {
             setData(orderData);
             setLoading(false);
         })
         .catch(e => {
             console.error(e);
             setErr("Could not verify payment. Please contact support.");
             setLoading(false);
         });
       
       return; // <--- STOP HERE so we don't run the code below
    }

    // ---------------------------------------------------------
    // STANDARD LOAD (For existing orders with real UUIDs)
    // ---------------------------------------------------------
    setLoading(true);
    setErr(null);
    fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/status`)
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(setData)
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
      <div style={{ padding: 40, textAlign: "center" }}>
          <h2>Processing Order...</h2>
          <div className="spinner" style={{ 
              width: 30, height: 30, border: "3px solid #ccc", borderTop: "3px solid #000", 
              borderRadius: "50%", margin: "20px auto", animation: "spin 1s linear infinite" 
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
  );

  if (err) return <div style={{ padding: 24, color: "crimson" }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 24 }}>Order not found</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <Link to="/" style={{ color: "#666", textDecoration: "none" }}>← Back Home</Link>
      
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 32, marginTop: 20, background: "white" }}>
          <h1 style={{ color: "green", marginTop: 0 }}>Order Confirmed!</h1>
          <p style={{ fontSize: 18, color: "#444" }}>Thank you for your purchase.</p>
          
          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, marginTop: 20 }}>
              <div style={{ marginBottom: 8 }}>
                  <strong>Order ID:</strong> <span style={{ fontFamily: "monospace" }}>{data.order_id}</span>
              </div>
              <div>
                  <strong>Status:</strong> <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: 4, fontWeight: "bold", fontSize: 14 }}>{data.derived_status}</span>
              </div>
              <div style={{ marginTop: 8 }}>
                  <strong>Total:</strong> ${(data.total_cents / 100).toFixed(2)}
              </div>
          </div>
      </div>
    </div>
  );
}