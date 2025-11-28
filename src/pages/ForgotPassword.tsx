import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

const styles = {
    // Shared styles from Login
    primary: "#111827",
    errorBg: "#fee2e2",
    errorText: "#b91c1c",
    errorBorder: "#fecaca",
    borderColor: "#e5e7eb",
    wrapper: {
        maxWidth: 420,
        margin: "60px auto",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: "#0f172a",
    },
    button: {
        padding: "10px 16px",
        borderRadius: 8,
        background: "#111827",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        width: "100%",
        fontWeight: 600,
        transition: "opacity 0.15s",
        fontSize: 15,
    },
    input: {
        width: "100%",
        padding: "10px",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        marginBottom: 10,
        outline: "none",
        transition: "border-color 0.15s",
        fontSize: 15,
    },
    error: {
        color: "#b91c1c",
        background: "#fee2e2",
        border: "1px solid #fecaca",
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14,
    },
    success: {
        color: "#16a34a",
        background: "#f0fff4",
        border: "1px solid #bbf7d0",
        padding: 10,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14,
        fontWeight: 600
    },
    label: {
        display: "block",
        fontSize: 14,
        marginBottom: 4,
        color: "#374151",
        fontWeight: 500,
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

            // Backend always returns 202 accepted (even if email not found) to prevent user enumeration
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
            <h1 style={{ marginBottom: 12, fontSize: 24, fontWeight: 700, textAlign: "center" }}>Reset Password</h1>
            <p style={{ marginBottom: 24, fontSize: 14, color: "#64748b", textAlign: "center" }}>Enter your email address to receive a password reset link.</p>

            {statusMsg && (
                <div style={styles.success}>
                    {statusMsg}
                </div>
            )}
            {err && (
                <div style={styles.error}>
                    {err}
                </div>
            )}

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
                    />
                </div>
                <button
                    disabled={loading}
                    style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? "Sending link…" : "Send Reset Link"}
                </button>
            </form>
            <div style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
                <Link to="/login" style={{ color: styles.primary, fontWeight: 500 }}>← Back to Sign In</Link>
            </div>
        </div>
    );
}