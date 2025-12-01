// src/pages/ChangePassword.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/api";
import { useToast } from "../context/ToastContext"; 

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const EyeIcon = () => (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = () => (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" /></svg>);

export default function ChangePassword() {
  const nav = useNavigate();
  const { toast } = useToast(); 
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (newPassword !== confirmPassword) {
        setErr("New passwords do not match.");
        return;
    }

    // --- NEW CHECK: Prevent same password ---
    if (currentPassword === newPassword) {
        setErr("New password must be different from your current password.");
        return;
    }
    // ----------------------------------------

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            ...authHeaders()
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to update password (${res.status})`);
      }

      toast("Password changed successfully!");
      nav("/account");
      
    } catch (e: any) {
      setErr(e?.message ?? "Error changing password");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
      width: "100%", 
      padding: "10px 12px", 
      paddingRight: "40px", 
      border: "1px solid #e5e7eb", 
      borderRadius: 8, 
      fontSize: 16, 
      boxSizing: "border-box" as const
  };

  const eyeBtnStyle = {
      position: "absolute" as const,
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "#6b7280",
      padding: 4,
      display: "flex",
      alignItems: "center"
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 32, fontFamily: "Inter, sans-serif", color: "#0f172a" }}>
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: 800 }}>Change Password</h1>

      {err && (
        <div style={{ color: "#b91c1c", background: "#fee2e2", border: "1px solid #fecaca", padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {err}
        </div>
      )}

      <form onSubmit={submit}>
        
        {/* CURRENT PASSWORD */}
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Current Password</label>
            <div style={{ position: "relative" }}>
                <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={inputStyle}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={eyeBtnStyle} tabIndex={-1}>
                    {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
        </div>

        {/* NEW PASSWORD */}
        <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>New Password</label>
            <div style={{ position: "relative" }}>
                <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    style={inputStyle}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} style={eyeBtnStyle} tabIndex={-1}>
                    {showNew ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
        </div>

        {/* CONFIRM PASSWORD */}
        <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Confirm New Password</label>
            <div style={{ position: "relative" }}>
                <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    style={inputStyle}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={eyeBtnStyle} tabIndex={-1}>
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
            <button
            type="button"
            onClick={() => nav("/account")}
            style={{ flex: 1, padding: "12px", borderRadius: 8, background: "#fff", color: "#333", border: "1px solid #e5e7eb", cursor: "pointer", fontWeight: 600 }}
            >
            Cancel
            </button>
            <button
            disabled={saving}
            style={{ flex: 1, padding: "12px", borderRadius: 8, background: "#111827", color: "#fff", border: "1px solid #111827", cursor: "pointer", fontWeight: 600, opacity: saving ? 0.7 : 1 }}
            >
            {saving ? "Updating..." : "Update"}
            </button>
        </div>
      </form>
    </div>
  );
}