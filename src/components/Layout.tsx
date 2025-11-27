import Nav from "./Nav";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Nav />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        {/* 👇 This is where child pages render */}
        <Outlet />
      </main>
    </div>
  );
}

