// src/pages/Orders.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";

type OrderStatusRow = {
    order_id: string;
    friendly_id?: string; 
    email: string;
    total_cents: number;
    created_at: string;
    derived_status: string;
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Dark Mode Styles
const styles = {
  container: {
    maxWidth: 800,
    margin: "40px auto",
    padding: "0 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#fff",
  },
  header: {
    marginBottom: 24,
    borderBottom: "1px solid #333",
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 900,
    margin: "0 0 8px 0",
    letterSpacing: "-1px",
    color: "#fff",
  },
  card: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: 12,
    padding: 32,
    textAlign: "center" as const,
    color: "#fff"
  },
  orderList: {
    display: "grid",
    gap: 16,
  },
  orderItem: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: 12,
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textDecoration: "none",
    color: "#fff",
    transition: "border-color 0.2s",
  }
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderStatusRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/orders`, { headers: authHeaders() });
            
            if (res.status === 401) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true });
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load orders.`);

            const data: OrderStatusRow[] = await res.json();
            setOrders(data);

        } catch (e: any) {
            setError(e?.message ?? "Error fetching orders.");
        } finally {
            setLoading(false);
        }
    }
    loadOrders();
  }, [navigate]);

  if (loading) return <div style={styles.container}>Loading orders...</div>;
  if (error) return <div style={styles.container}><div style={{...styles.card, borderColor: '#ef4444', color: '#ef4444'}}>Error: {error}</div></div>;

  if (!orders || orders.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}><h1 style={styles.title}>My Orders</h1></div>
        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3 style={{color: '#fff', marginTop:0}}>No orders found</h3>
          <p style={{ color: "#888", marginBottom: 24 }}>You haven't placed any orders yet.</p>
          <Link to="/products" style={{ background: "#00ff41", color: "#000", padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Orders ({orders.length})</h1>
      </div>

      <div style={styles.orderList}>
        {orders.map((order) => (
            <Link 
                key={order.order_id} 
                to={`/order/${order.order_id}`} 
                style={styles.orderItem}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#666"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "#333"}
            >
                <div>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Use Friendly ID if present */}
                        Order #{order.friendly_id || order.order_id.slice(0, 8).toUpperCase()}
                        
                        <span style={{ 
                            fontSize: 11, 
                            // Dark Green BG for Paid, Dark Gray for others
                            background: order.derived_status === 'paid' ? '#052e16' : '#222', 
                            // Neon Green Text for Paid, Gray for others
                            color: order.derived_status === 'paid' ? '#4ade80' : '#888',
                            padding: "2px 8px", 
                            borderRadius: 99, 
                            fontWeight: 700,
                            textTransform: "capitalize",
                            border: order.derived_status === 'paid' ? '1px solid #14532d' : '1px solid #333'
                        }}>
                            {order.derived_status.replace('_', ' ')}
                        </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                        Placed: {new Date(order.created_at).toLocaleDateString()}
                    </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>
                    ${(order.total_cents / 100).toFixed(2)} &rarr;
                </div>
            </Link>
        ))}
      </div>
    </div>
  );
}