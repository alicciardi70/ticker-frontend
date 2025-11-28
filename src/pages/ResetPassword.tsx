import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState("");
    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Extract token from URL query parameters (?token=XYZ)
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

    // Display state: error, success, or form
    if (err || !token) {
        return (
            <div style={styles.wrapper}>
                <div style={styles.error}>{err || "Invalid link."}</div>
                <div style={{ marginTop: 20, textAlign: "center" }}>
                    <Link to="/login" style={{ color: styles.primary, fontWeight: 500 }}>← Back to Sign In</Link>
                </div>
            </div>
        );
    }
    
    if (statusMsg) {
        return (
            <div style={styles.wrapper}>
                <div style={styles.success}>{statusMsg}</div>
                <div style={{ marginTop: 20, textAlign: "center" }}>
                    <Link to="/login" style={{ color: styles.primary, fontWeight: 500 }}>← Proceed to Sign In</Link>
                </div>
            </div>
        );
    }


    return (
        <div style={styles.wrapper}>
            <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 700, textAlign: "center" }}>Set New Password</h1>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 16 }}>
                <div style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 12 }}>
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
                    />
                </div>
                
                <button
                    disabled={loading}
                    style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? "Resetting…" : "Reset Password"}
                </button>
            </form>
        </div>
    );
}