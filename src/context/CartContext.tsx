// src/context/CartContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE } from "../lib/api";

// Helper to get/set Guest ID
function getGuestId() {
  let id = localStorage.getItem("ticker_guest_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("ticker_guest_id", id);
  }
  return id;
}

export type CartItem = {
  id: string; // The CartItem ID (UUID)
  product_id: string;
  qty: number;
  product: {
    name: string;
    price_cents: number;
    image_url?: string | null;
  };
};

type CartContextType = {
  items: CartItem[];
  addToCart: (productId: string, qty?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  refreshCart: () => void;
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Trigger to force re-fetch
  const [tick, setTick] = useState(0); 

  useEffect(() => {
    async function fetchCart() {
      const token = localStorage.getItem("token");
      const guestId = getGuestId();
      
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      else headers["X-Guest-ID"] = guestId;

      try {
        const res = await fetch(`${API_BASE}/cart`, { headers });
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
    fetchCart();
  }, [tick]);

  const refreshCart = () => setTick(t => t + 1);

  const addToCart = async (productId: string, qty = 1) => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const guestId = getGuestId();
    
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    else headers["X-Guest-ID"] = guestId;

    try {
      await fetch(`${API_BASE}/cart/items`, {
        method: "POST",
        headers,
        body: JSON.stringify({ product_id: productId, qty }),
      });
      refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    const token = localStorage.getItem("token");
    const guestId = getGuestId();
    
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    else headers["X-Guest-ID"] = guestId;

    await fetch(`${API_BASE}/cart/items/${productId}`, { method: "DELETE", headers });
    refreshCart();
  };

  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = items.reduce((sum, i) => sum + (i.product.price_cents * i.qty), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, refreshCart, cartCount, cartTotal, isLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}