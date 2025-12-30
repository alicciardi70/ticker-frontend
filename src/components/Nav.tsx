import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";

// Updated Dark Theme Colors
const colors = {
  navBackground: "#000000", // Pure black header
  navBorder: "#222",        // Subtle border
  text: "#888",             // Muted text for inactive
  textActive: "#ffffff",    // White for active
  accent: "#00ff41",        // Ticker Green
  linkActiveBg: "#111",
  buttonBg: "#111",
  menuOverlayBg: "#0a0a0a",
  fontFamily: "inherit",
};

function NavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  const { pathname } = useLocation();
  const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
  
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 4,
        textDecoration: "none",
        color: isActive ? colors.accent : colors.text, // Green when active
        background: "transparent",
        fontWeight: isActive ? 600 : 400,
        display: "flex", 
        alignItems: "center",
        gap: 8,
        transition: "all 0.2s ease",
        fontFamily: colors.fontFamily,
        fontSize: '14px',
        letterSpacing: '-0.02em'
      }}
    >
      {children}
    </Link>
  );
}

export default function Nav() {
  const [authed, setAuthed] = useState<boolean>(!!localStorage.getItem("token"));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const nav = useNavigate();
  const location = useLocation();
  const { cartCount } = useCart(); 

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setAuthed(!!localStorage.getItem("token"));
  }, [location]);

  function logout() {
    localStorage.removeItem("token");
    setAuthed(false);
    setMenuOpen(false);
    nav("/login");
  }

  const NavItems = () => (
    <>
      <NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
      <NavLink to="/products" onClick={() => setMenuOpen(false)}>Products</NavLink>
      <NavLink to="/cart" onClick={() => setMenuOpen(false)}>
        Cart
        {cartCount > 0 && (
          <span style={{ 
            background: colors.accent, 
            color: "#000", 
            fontSize: 10, 
            fontWeight: 800, 
            padding: "2px 6px", 
            borderRadius: 99,
            minWidth: 16,
            textAlign: 'center',
          }}>
            {cartCount}
          </span>
        )}
      </NavLink>

      <NavLink to="/devices" onClick={() => setMenuOpen(false)}>My Devices</NavLink>
      <NavLink to="/orders" onClick={() => setMenuOpen(false)}>My Orders</NavLink>
      <NavLink to="/account" onClick={() => setMenuOpen(false)}>My Account</NavLink>

      {!authed ? (
        <NavLink to="/login" onClick={() => setMenuOpen(false)}>Login</NavLink>
      ) : (
        <button onClick={logout} style={{ 
          padding: "8px 16px", 
          width: "100%",
          textAlign: "left",
          border: "none", 
          background: "transparent",
          color: colors.text,
          cursor: "pointer",
          fontWeight: 400,
          marginTop: isMobile ? "10px" : "0",
          fontFamily: colors.fontFamily,
          fontSize: "14px"
        }}>
          Logout
        </button>
      )}
    </>
  );

  return (
    <header style={{ 
      background: colors.navBackground, 
      borderBottom: `1px solid ${colors.navBorder}`,
      position: "relative",
      zIndex: 50
    }}>
      <div style={{ 
        maxWidth: 1200, 
        margin: "0 auto", 
        padding: "12px 20px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between" 
      }}>
        <Link to="/" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-1px', color: '#fff' }}>
                TICKER<span style={{ color: '#00ff41' }}>.INK</span>
            </div>
        </Link>

        {!isMobile && (
          <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <NavItems />
          </nav>
        )}

        {isMobile && (
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "white" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {isMobile && menuOpen && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: colors.menuOverlayBg, borderBottom: `1px solid ${colors.navBorder}`,
          padding: "20px", display: "flex", flexDirection: "column", gap: "10px"
        }}>
          <NavItems />
        </div>
      )}
    </header>
  );
}