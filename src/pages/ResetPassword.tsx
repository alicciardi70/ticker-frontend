import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE } from "../lib/api";

const styles = {
    wrapper: {
        maxWidth: 420,
        margin: "60px auto",
        background: "#111",
        border: "1px solid #333",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.5)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#fff",
    },
    button: {
        padding: "12px 16px",
        borderRadius: 8,
        background: "#fff",
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
        background: "#000",
        border: "1px solid #333",
        borderRadius: 8,
        marginBottom: 10,
        outline: "none",
        color: "#fff",
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
        color: "#888",
        fontWeight: 500,
    },
    link: {
        color: "#888",
        textDecoration: "none",
        fontSize: 14,
        transition: "color 0.2s"
    }
};

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState("");
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const t = searchParams.get("token");
        if (t) {
            setToken(t);
        } else {
            setErr("Missing password reset token in URL.");
        }
    }, [searchParams]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setStatusMsg(null);
        if (!token) return setErr("Missing token.");

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: token, password: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                 throw new Error(data.detail || `Reset failed: ${res.status}`);
            }

            setStatusMsg(data.message || "Success! Your password has been updated.");

        } catch (e: any) {
            setErr(e?.message ?? "Password reset failed");
        } finally {
            setLoading(false);
        }
    }

    if (err || !token) {
        return (
            <div style={styles.wrapper}>
                <div style={styles.error}>{err || "Invalid link."}</div>
                <div style={{ marginTop: 20, textAlign: "center" }}>
                    <Link to="/login" style={styles.link}>← Back to Sign In</Link>
                </div>
            </div>
        );
    }
    
    if (statusMsg) {
        return (
            <div style={styles.wrapper}>
                <div style={styles.success}>{statusMsg}</div>
                <div style={{ marginTop: 20, textAlign: "center" }}>
                    <Link to="/login" style={styles.link}>← Proceed to Sign In</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.wrapper}>
            <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 700, textAlign: "center", color: '#fff' }}>Set New Password</h1>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
                <div style={{ fontSize: 14, color: "#888", textAlign: "center", marginBottom: 12 }}>
                    Please enter your new password (minimum 8 characters).
                </div>
                
                <div>
                    <label style={styles.label}>New Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={8}
                        style={styles.input}
                        placeholder="••••••••"
                    />
                </div>
                
                <button
                    disabled={loading}
                    style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? "Resetting..." : "Reset Password"}
                </button>
            </form>
        </div>
    );
}