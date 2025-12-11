export function DeviceFinancePanel() {
  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
        {/* Header Row Placeholder */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
           <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Finance Settings</h3>
           {/* No buttons for now, or could add disabled ones */}
        </div>

        <div className="empty-state">
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🚧</div>
            <div className="h1">Finance</div>
            <div className="sub">Stock tickers coming soon.</div>
        </div>
    </div>
  );
}