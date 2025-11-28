import { Link } from "react-router-dom";

// Standard styles copied from Account/Login for consistency
const styles = {
    container: {
        maxWidth: 1100,
        margin: "40px auto",
        padding: "0 20px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: "#0f172a",
    },
    title: {
        fontSize: 32,
        fontWeight: 800,
        margin: "0 0 8px 0",
        letterSpacing: "-0.5px",
    },
    subtitle: {
        color: "#64748b",
        fontSize: 16,
        marginBottom: 30,
    },
};

export default function Products() {
    // --- MOCK DATA FOR LISTING ---
    const products = [
        // Using data seen in your backend response earlier
        { id: "3c0e6c9a", name: "Yankees LED Scoreboard", slug: "p-ny-led-64x32", price: "$179.00" },
        { id: "b93a3cc0", name: "Ticker Device Kit", slug: "p-esp32-kit", price: "$39.00" },
    ];

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>All Ticker Products</h1>
            <p style={styles.subtitle}>Browse our available physical ticker displays and kits.</p>
            
            {/* Simple Responsive Grid Layout */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                {products.map(p => (
                    <div key={p.id} style={{ padding: 20, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                        <h3 style={{ margin: "0 0 5px 0", fontSize: 18, fontWeight: 700 }}>{p.name}</h3>
                        <div style={{ fontWeight: 600, color: "#111827", marginBottom: 15 }}>{p.price}</div>
                        <Link 
                            to={`/products/${p.slug}`} 
                            style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}
                        >
                            View Details →
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}