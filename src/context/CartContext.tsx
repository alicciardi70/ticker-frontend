import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { API_BASE } from "../lib/api";
import { v4 as uuidv4 } from 'uuid'; // <--- IMPORT THIS

function getGuestId() {
  let id = localStorage.getItem("ticker_guest_id");
  if (!id) {
    id = uuidv4(); // <--- FIXED: Works on Android/iOS/Web
    localStorage.setItem("ticker_guest_id", id);
  }
  return id;
}

export type CartItem = {
  id: string; 
  product_id: string;
  qty: number;
  product: {
    name: string;
    price_cents: number;
    image_url?: string | null;
    discount_cents?: number; // Added to match your UI logic
  };
};

type CartContextType = {
  items: CartItem[];
  addToCart: (productId: string, qty?: number) => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<void>;
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
  const [tick, setTick] = useState(0); 

  useEffect(() => {
    async function fetchCart() {
      const token = localStorage.getItem("token");
      const guestId = getGuestId();
      
      const headers: any = { "Content-Type": "application/json" };
      // Always send guest ID if we have it, even if logged in (helps backend merge)
      if (guestId) headers["X-Guest-ID"] = guestId; 
      if (token) headers["Authorization"] = `Bearer ${token}`;

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

  // --- API HELPERS ---
  const getHeaders = () => {
    const token = localStorage.getItem("token");
    const headers: any = { "Content-Type": "application/json" };
    // Fix: Send both if available so backend can link them
    const guestId = getGuestId();
    if (guestId) headers["X-Guest-ID"] = guestId;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const addToCart = async (productId: string, qty = 1) => {
    setIsLoading(true);
    try {
      await fetch(`${API_BASE}/cart/items`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ product_id: productId, qty }),
      });
      refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  const updateQty = async (productId: string, qty: number) => {
    // Optimistic UI update
    setItems(prev => prev.map(i => i.product_id === productId ? { ...i, qty } : i));
    
    await fetch(`${API_BASE}/cart/items/${productId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ qty }),
    });
    refreshCart(); // Sync with server to be sure
  };

  const removeFromCart = async (productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
    await fetch(`${API_BASE}/cart/items/${productId}`, { method: "DELETE", headers: getHeaders() });
    refreshCart();
  };

  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = items.reduce((sum, i) => sum + (i.product.price_cents * i.qty), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, updateQty, removeFromCart, refreshCart, cartCount, cartTotal, isLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}