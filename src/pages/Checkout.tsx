// src/pages/Checkout.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

export default function Checkout() {
  // FIX 1: Match the variable name to your Route path "/checkout/:id"
  const { id } = useParams(); 
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initiateCheckout() {
      try {
        const token = localStorage.getItem("token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };
        
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // FIX 2: Update the URL to include the '/payments' prefix
        // We also use 'id' here instead of 'slug'
        const res = await fetch(`${API_BASE}/payments/create-checkout-session`, {
          method: "POST",
          headers,
          body: JSON.stringify({ 
            product_slug: id, // We send the ID from the URL as the slug
            quantity: 1 
          }),
        });

        if (!res.ok) {
          throw new Error(`Payment gateway error: ${res.statusText}`);
        }

        const data = await res.json();

        if (data.url && isMounted) {
          window.location.href = data.url; 
        } else {
          throw new Error("No payment URL returned.");
        }

      } catch (err: any) {
        if (isMounted) setError(err.message || "Something went wrong initializing checkout.");
      }
    }

    // Only run if 'id' exists
    if (id) {
      initiateCheckout();
    } else {
        setError("Invalid product link.");
    }
  }, [id]);

  if (error) {
    return (
      <div style={{ padding: 40, maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ color: "crimson" }}>Checkout Error</h2>
        <p>{error}</p>
        <Link to="/" style={{ color: "#2563eb", fontWeight: 600 }}>Return to Products</Link>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ 
        width: 40, 
        height: 40, 
        border: "4px solid #e5e7eb", 
        borderTop: "4px solid #111", 
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: 20
      }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>Securely redirecting to payment...</h2>
      <p style={{ color: "#64748b" }}>Please do not close this window.</p>
    </div>
  );
}