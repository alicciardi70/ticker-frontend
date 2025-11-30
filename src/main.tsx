// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import { CartProvider } from "./context/CartContext"; // <--- Import

const el = document.getElementById("root");
if (!el) throw new Error("root div missing");

createRoot(el).render(
  <CartProvider> {/* <--- WRAP APP */}
    <App />
  </CartProvider>
);
