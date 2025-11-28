import { useNavigate } from "react-router-dom";

const styles = {
  container: {
    maxWidth: 600,
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
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 15,
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#dc2626", // Red for danger/logout
    fontWeight: 600,
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 15,
    marginTop: 24,
  },
};

export default function Account() {
  const navigate = useNavigate();
  // Mock email for now since we don't have a user context yet
  const email = "user@example.com"; 

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
            <span style={{ color: "#64748b" }}>Email</span>
            <span style={{ fontWeight: 500 }}>{email}</span>
          </div>
          <div style={{ ...styles.row, borderBottom: "none" }}>
            <span style={{ color: "#64748b" }}>Password</span>
            <span style={{ color: "#2563eb", cursor: "pointer", fontWeight: 500 }}>Change</span>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.label}>Preferences</div>
        <div style={styles.card}>
          <div style={{ ...styles.row, borderBottom: "none" }}>
            <span style={{ color: "#64748b" }}>Notifications</span>
            <span style={{ color: "#16a34a", fontWeight: 500 }}>Enabled</span>
          </div>
        </div>
      </div>

      <button style={styles.button} onClick={handleLogout}>
        Sign Out
      </button>
    </div>
  );
}