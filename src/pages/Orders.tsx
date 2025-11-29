// src/pages/Orders.tsx (DROP-IN REPLACEMENT WITH AUTHENTICATION CHECK)

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";

// Assuming Order structure
type Order = {
    id: string;
    email: string;
    total_cents: number;
    created_at: string;
    // ... potentially other fields and items
};

// Helper to get authorization headers (copied from Account.tsx)
function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const styles = {
  container: {
    maxWidth: 800,
    margin: "40px auto",
    padding: "0 20px",
    // 🚨 FONT FIX: Use modern font stack for consistency
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
    color: "#0f172a",
  },
  header: {
    marginBottom: 24,
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 32,
    textAlign: "center" as const,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  muted: {
    color: "#64748b",
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    display: "inline-block",
    textDecoration: "none",
    background: "#111827",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
  },
  // New style for the list wrapper
  orderList: {
    display: "grid",
    gap: 16,
  },
  // New style for an individual order item
  orderItem: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  }
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🚨 FIX: Add data fetching and authentication check
  useEffect(() => {
    async function loadOrders() {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        if (!token) {
            // No token found, redirect immediately
            navigate("/login", { replace: true });
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/orders`, { headers: authHeaders() });
            
            if (res.status === 401) {
                // Token invalid or expired, redirect
                localStorage.removeItem("token");
                navigate("/login", { replace: true });
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load orders.`);

            const data: Order[] = await res.json();
            setOrders(data);

        } catch (e: any) {
            setError(e?.message ?? "Error fetching orders.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    loadOrders();
  }, [navigate]);


  // --- Render Logic ---

  if (loading) {
    return (
        <div style={styles.container}>
            <div style={styles.header}><h1 style={styles.title}>My Orders</h1></div>
            <div style={styles.card}>Loading orders...</div>
        </div>
    );
  }

  if (error) {
    return (
        <div style={styles.container}>
            <div style={styles.header}><h1 style={styles.title}>My Orders</h1></div>
            <div style={{...styles.card, color: 'crimson'}}>Error: {error}</div>
        </div>
    );
  }

  if (orders === null || orders.length === 0) {
    // Show "No orders found" card
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>My Orders</h1>
        </div>

        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 600 }}>No orders found</h3>
          <p style={styles.muted}>You haven't placed any orders yet.</p>
          <Link to="/" style={styles.button}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // Display the list of orders (simple list view)
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Orders ({orders.length})</h1>
      </div>

      <div style={styles.orderList}>
        {orders.map((order) => (
            <div key={order.id} style={styles.orderItem}>
                <div>
                    <div style={{ fontWeight: 600 }}>Order ID: {order.id.slice(0, 8)}...</div>
                    <div style={{ fontSize: 13, color: styles.muted.color }}>Placed: {new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ fontWeight: 700 }}>
                    Total: ${(order.total_cents / 100).toFixed(2)}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}