import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

const styles = {
    wrapper: {
        maxWidth: 420,
        margin: "60px auto",
        background: "#111", // Dark card background
        border: "1px solid #333", // Dark border
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.5)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#fff", // White text
    },
    button: {
        padding: "12px 16px",
        borderRadius: 8,
        background: "#fff", // White button (or #00ff41 for neon)
        color: "#000",
        border: "none",
        cursor: "pointer",
        width: "100%",
        fontWeight: 700,
        transition: "opacity 0.15s",
        fontSize: 15,
        marginTop: 10
    },
    input: {
        width: "100%",
        padding: "12px",
        background: "#000", // Black input background
        border: "1px solid #333", // Dark input border
        borderRadius: 8,
        marginBottom: 10,
        outline: "none",
        color: "#fff", // White text input
        fontSize: 15,
    },
    error: {
        color: "#ef4444",
        background: "rgba(239, 68, 68, 0.1)",
        border: "1px solid rgba(239, 68, 68, 0.2)",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14,
    },
    success: {
        color: "#00ff41",
        background: "rgba(0, 255, 65, 0.05)",
        border: "1px solid rgba(0, 255, 65, 0.2)",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14,
        fontWeight: 600
    },
    label: {
        display: "block",
        fontSize: 14,
        marginBottom: 6,
        color: "#888", // Dimmer label
        fontWeight: 500,
    },
    link: {
        color: "#888",
        textDecoration: "none",
        fontSize: 14,
        transition: "color 0.2s"
    }
};

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setStatusMsg(null);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/forgot`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            if (res.status === 202) {
                setStatusMsg("If that email is in our system, you will receive a password reset link shortly.");
            } else {
                 throw new Error(`Request failed: ${res.status} ${res.statusText}`);
            }

        } catch (e: any) {
            setErr(e?.message ?? "Request failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.wrapper}>
            <h1 style={{ marginBottom: 12, fontSize: 24, fontWeight: 700, textAlign: "center", color: '#fff' }}>Reset Password</h1>
            <p style={{ marginBottom: 24, fontSize: 14, color: "#888", textAlign: "center" }}>Enter your email address to receive a password reset link.</p>

            {statusMsg && <div style={styles.success}>{statusMsg}</div>}
            {err && <div style={styles.error}>{err}</div>}

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
                <div>
                    <label style={styles.label}>Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        style={styles.input}
                        placeholder="name@example.com"
                    />
                </div>
                <button
                    disabled={loading}
                    style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? "Sending..." : "Send Reset Link"}
                </button>
            </form>
            <div style={{ marginTop: 24, textAlign: "center" }}>
                <Link to="/login" style={styles.link}>← Back to Sign In</Link>
            </div>
        </div>
    );
}