import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// Define dark theme colors for consistency
const colors = {
  // CHANGED: Set to pure black #000000 to match the LED logo background perfectly
  navBackground: "#000000", 
  navBorder: "#333333",     // Slightly lighter border for contrast
  text: "#f9fafb",          // Almost white text
  textActive: "#ffffff",    // Pure white for active link
  linkActiveBg: "#1f2937",  // Subtle lighter gray for active state background
  buttonBg: "#1f2937",      // Dark background for logout button
};

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname, hash } = useLocation();
  const isActive = (hash.replace("#", "") || "/") === to || pathname === to;
  
  return (
    <Link
      to={to}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        textDecoration: "none",
        color: isActive ? colors.textActive : colors.text,
        background: isActive ? colors.linkActiveBg : "transparent",
        fontWeight: isActive ? 600 : 400,
        transition: "all 0.2s ease-in-out",
      }}
    >
      {children}
    </Link>
  );
}

export default function Nav() {
  const [authed, setAuthed] = useState<boolean>(!!localStorage.getItem("token"));
  const nav = useNavigate();

  useEffect(() => {
    const onStorage = () => setAuthed(!!localStorage.getItem("token"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    setAuthed(false);
    nav("/login");
  }

  return (
    <header style={{ background: colors.navBackground, borderBottom: `1px solid ${colors.navBorder}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Logo Link */}
        <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img 
            src="/logo.png" 
            alt="Ticker Ink" 
            style={{ 
              // CHANGED: Increased height to 120px (makes it much larger)
              height: "120px", 
              width: "auto",
              objectFit: "contain"
            }} 
          />
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/devices">My Devices</NavLink>
          <NavLink to="/orders">My Orders</NavLink>
          <NavLink to="/account">My Account</NavLink>

          {!authed ? (
            <NavLink to="/login">Login</NavLink>
          ) : (
            <button onClick={logout} style={{ 
              padding: "8px 12px", 
              borderRadius: 8, 
              border: `1px solid ${colors.navBorder}`, 
              background: colors.buttonBg, 
              color: colors.text,
              cursor: "pointer",
              fontWeight: 600,
              transition: "all 0.2s ease-in-out",
              fontFamily: "inherit",
              fontSize: "inherit"
            }}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}