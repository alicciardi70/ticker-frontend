// src/pages/Orders.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";

type OrderStatusRow = {
    order_id: string;
    friendly_id?: string; // <--- NEW FIELD
    email: string;
    total_cents: number;
    created_at: string;
    derived_status: string;
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const styles = {
  container: {
    maxWidth: 800,
    margin: "40px auto",
    padding: "0 20px",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
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
  },
  orderList: {
    display: "grid",
    gap: 16,
  },
  orderItem: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    textDecoration: "none",
    color: "inherit",
    transition: "box-shadow 0.2s",
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
  if (error) return <div style={styles.container}><div style={{...styles.card, color: 'crimson'}}>Error: {error}</div></div>;

  if (!orders || orders.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}><h1 style={styles.title}>My Orders</h1></div>
        <div style={styles.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h3>No orders found</h3>
          <p style={{ color: "#64748b", marginBottom: 24 }}>You haven't placed any orders yet.</p>
          <Link to="/" style={{ background: "#111", color: "#fff", padding: "10px 20px", borderRadius: 8, textDecoration: "none" }}>
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
            <Link key={order.order_id} to={`/order/${order.order_id}`} style={styles.orderItem}>
                <div>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
                        {/* FIX: Use Friendly ID if present, otherwise slice UUID */}
                        Order #{order.friendly_id || order.order_id.slice(0, 8).toUpperCase()}
                        
                        <span style={{ 
                            fontSize: 12, 
                            background: order.derived_status === 'paid' ? '#dcfce7' : '#f1f5f9', 
                            color: order.derived_status === 'paid' ? '#166534' : '#475569',
                            padding: "2px 8px", 
                            borderRadius: 99, 
                            fontWeight: 700,
                            textTransform: "capitalize"
                        }}>
                            {order.derived_status.replace('_', ' ')}
                        </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                        Placed: {new Date(order.created_at).toLocaleDateString()}
                    </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                    ${(order.total_cents / 100).toFixed(2)} &rarr;
                </div>
            </Link>
        ))}
      </div>
    </div>
  );
}