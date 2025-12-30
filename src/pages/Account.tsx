import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Dark Mode Styles
const styles = {
  container: {
    maxWidth: 600,
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
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  card: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    padding: "16px 20px",
    borderBottom: "1px solid #222",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 15,
    color: "#fff"
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "#111",
    border: "1px solid #333",
    color: "#ef4444", // Red for logout
    fontWeight: 600,
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 15,
    marginTop: 24,
    transition: "all 0.2s"
  },
};

export default function Account() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('Loading profile...'); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserEmail() {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
            setUserEmail('Not logged in');
            navigate("/login", { replace: true });
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
            
            if (res.status === 401) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true });
                return;
            }
            if (!res.ok) throw new Error("Failed to load user profile.");

            const data = await res.json();
            
            if (data.email) {
                setUserEmail(data.email);
            } else {
                setUserEmail('Email not found in profile.');
            }
        } catch (e) {
            setUserEmail('Error fetching email.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    fetchUserEmail();
  }, [navigate]);


  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Account Settings</h1>
      </div>

      <div style={styles.section}>
        <div style={styles.label}>Profile</div>
        <div style={styles.card}>
          <div style={styles.row}>
            <span style={{ color: "#888" }}>Email</span>
            <span style={{ fontWeight: 500 }}>{loading ? 'Loading...' : userEmail}</span> 
          </div>
          <div style={{ ...styles.row, borderBottom: "none" }}>
            <span style={{ color: "#888" }}>Password</span>
            <span 
                onClick={() => navigate("/change-password")} 
                style={{ color: "#00ff41", cursor: "pointer", fontWeight: 500 }}
            >
                Change
            </span>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.label}>Preferences</div>
        <div style={styles.card}>
          <div style={{ ...styles.row, borderBottom: "none" }}>
            <span style={{ color: "#888" }}>Notifications</span>
            <span style={{ color: "#00ff41", fontWeight: 500 }}>Enabled</span>
          </div>
        </div>
      </div>

      <button 
        style={styles.button} 
        onClick={handleLogout}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = "#ef4444"}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = "#333"}
      >
        Sign Out
      </button>
    </div>
  );
}