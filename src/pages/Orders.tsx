import { Link } from "react-router-dom";

// Inline styles for simplicity, or move to Orders.css if preferred
const styles = {
  container: {
    maxWidth: 800,
    margin: "40px auto",
    padding: "0 20px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
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
};

export default function Orders() {
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