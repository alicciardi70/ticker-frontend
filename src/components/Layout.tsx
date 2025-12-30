import Nav from "./Nav";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0a0a0a", // Dark background matching Landing
      color: "#ffffff",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <Nav />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
