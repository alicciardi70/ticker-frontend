import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname, hash } = useLocation();
  // HashRouter uses hash, but pathname still updates; check both
  const isActive = (hash.replace("#", "") || "/") === to || pathname === to;
  return (
    <Link
      to={to}
      style={{
        padding: "8px 10px",
        borderRadius: 8,
        textDecoration: "none",
        color: isActive ? "#111827" : "#374151",
        background: isActive ? "#eef2ff" : "transparent",
        border: isActive ? "1px solid #c7d2fe" : "1px solid transparent",
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
    <header style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ fontWeight: 800, letterSpacing: 0.2, color: "#111827", textDecoration: "none", fontSize: 18 }}>
          Ticker Ink
        </Link>

        <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/devices">My Devices</NavLink>
          <NavLink to="/orders">My Orders</NavLink>
          <NavLink to="/account">My Account</NavLink>

          {!authed ? (
            <NavLink to="/login">Login</NavLink>
          ) : (
            <button onClick={logout} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer" }}>
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
