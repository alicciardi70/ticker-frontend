// src/components/Nav.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext"; // <--- IMPORT HOOK

// Define dark theme colors
const colors = {
  navBackground: "#000000",
  navBorder: "#333333",
  text: "#f9fafb",
  textActive: "#ffffff",
  linkActiveBg: "#1f2937",
  buttonBg: "#1f2937",
  menuOverlayBg: "#111827",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

// Helper component for individual links
function NavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  const { pathname } = useLocation();
  const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
  
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 8,
        textDecoration: "none",
        color: isActive ? colors.textActive : colors.text,
        background: isActive ? colors.linkActiveBg : "transparent",
        fontWeight: isActive ? 600 : 400,
        display: "flex", // Changed to flex for badges
        alignItems: "center",
        gap: 8,
        transition: "all 0.2s ease-in-out",
        fontFamily: colors.fontFamily,
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
  const { cartCount } = useCart(); // <--- GET CART COUNT

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

  // Common Navigation Items
  const NavItems = () => (
    <>
      <NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
      <NavLink to="/products" onClick={() => setMenuOpen(false)}>Products</NavLink>
      
      {/* CART LINK WITH BADGE */}
      <NavLink to="/cart" onClick={() => setMenuOpen(false)}>
        Cart
        {cartCount > 0 && (
          <span style={{ 
            background: "#ef4444", // Red badge
            color: "white", 
            fontSize: 11, 
            fontWeight: 700, 
            padding: "2px 6px", 
            borderRadius: 99,
            minWidth: 18,
            textAlign: 'center',
            lineHeight: 1
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
          padding: "10px 16px", 
          width: "100%",
          textAlign: "left",
          borderRadius: 8, 
          border: "none", 
          background: "transparent",
          color: colors.text,
          cursor: "pointer",
          fontWeight: 600,
          marginTop: isMobile ? "10px" : "0",
          fontFamily: colors.fontFamily,
          fontSize: "inherit"
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
        
        {/* LOGO */}
        <Link to="/" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img 
            src="/logo_blue.jpg" 
            alt="Ticker Ink" 
            style={{ 
              height: isMobile ? "70px" : "120px", 
              width: "auto",
              objectFit: "contain",
              transition: "height 0.3s ease"
            }} 
          />
        </Link>

        {/* DESKTOP NAV */}
        {!isMobile && (
          <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <NavItems />
          </nav>
        )}

        {/* MOBILE HAMBURGER */}
        {isMobile && (
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {/* Simple Hamburger Icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        )}
      </div>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: colors.menuOverlayBg,
          borderBottom: `1px solid ${colors.navBorder}`,
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.5)"
        }}>
          <NavItems />
        </div>
      )}
    </header>
  );
}