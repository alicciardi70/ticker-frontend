import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { API_BASE } from "../lib/api";

export default function Cart() {
  const { items, cartTotal, updateQty, removeFromCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  // --- PRICE CALCULATIONS ---

  // Original (pre-discount) subtotal in cents
  const originalSubtotalCents = items.reduce((sum, item) => {
    return sum + item.product.price_cents * item.qty;
  }, 0);

  // Total savings across the entire cart (based on product.discount_cents)
  const totalSavingsCents = items.reduce((sum, item) => {
    const perUnitDiscount = item.product.discount_cents || 0;
    return sum + perUnitDiscount * item.qty;
  }, 0);

  // Final subtotal after discounts (what you'll actually charge before tax/shipping)
  const discountedSubtotalCents = Math.max(
    originalSubtotalCents - totalSavingsCents,
    0
  );

  // Stable ordering to prevent items from "jumping" when qty changes
  const sortedItems = [...items].sort((a, b) =>
    a.product.name.localeCompare(b.product.name)
  );

  // Reusing your font/style system
  const styles = {
    container: {
      maxWidth: 900,
      margin: "40px auto",
      padding: "0 20px",
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
      color: "#0f172a",
    },
    header: {
      fontSize: 32,
      fontWeight: 800,
      marginBottom: 24,
      letterSpacing: "-0.5px",
    },
    card: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: 24,
    },
    item: {
      display: "flex",
      gap: 20,
      paddingBottom: 24,
      borderBottom: "1px solid #f1f5f9",
      marginBottom: 24,
    },
    qtyBtn: {
      width: 32,
      height: 32,
      border: "1px solid #e5e7eb",
      background: "#fff",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 16,
      color: "#334155",
    },
  };

  async function handleCheckout() {
    setCheckingOut(true);
    const token = localStorage.getItem("token");
    const guestId = localStorage.getItem("ticker_guest_id");

    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    else headers["X-Guest-ID"] = guestId;

    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
      };

      const res = await fetch(
        `${API_BASE}/payments/create-checkout-session`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Checkout failed");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert("Something went wrong initializing checkout.");
      setCheckingOut(false);
    }
  }

  if (items.length === 0) {
    return (
      <div style={styles.container}>
        <h1 style={styles.header}>Your Cart</h1>
        <div
          style={{
            ...styles.card,
            textAlign: "center",
            padding: 60,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>
            Your cart is empty
          </h3>
          <p style={{ color: "#64748b", marginBottom: 24 }}>
            Looks like you haven't added anything yet.
          </p>
          <Link
            to="/"
            style={{
              background: "#111",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Your Cart</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 32,
        }}
      >
        {/* LEFT: ITEMS LIST */}
        <div style={styles.card}>
          {sortedItems.map((item) => {
            const originalPrice = item.product.price_cents / 100;
            const discount = (item.product.discount_cents || 0) / 100;
            const finalPrice = Math.max(originalPrice - discount, 0);
            const hasDiscount = (item.product.discount_cents || 0) > 0;

            return (
              <div key={item.id} style={styles.item}>
                {item.product.image_url && (
                  <img
                    src={item.product.image_url}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #f1f5f9",
                    }}
                  />
                )}

                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontWeight: 600, marginBottom: 4 }}
                  >
                    {item.product.name}
                  </div>

                  {/* PRICE BLOCK */}
                  {hasDiscount ? (
                    <div style={{ marginTop: 2 }}>
                      {/* Final (discounted) per-unit price */}
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#16a34a",
                        }}
                      >
                        ${finalPrice.toFixed(2)} each
                      </div>

                      {/* Original per-unit price, struck through */}
                      <div
                        style={{
                          fontSize: 12,
                          color: "#9ca3af",
                          textDecoration: "line-through",
                        }}
                      >
                        ${originalPrice.toFixed(2)} each
                      </div>

                      {/* Per-unit savings */}
                      <div
                        style={{
                          fontSize: 12,
                          color: "#16a34a",
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        You save ${discount.toFixed(2)} each
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: 14,
                      }}
                    >
                      ${originalPrice.toFixed(2)} each
                    </div>
                  )}
                </div>

                {/* CONTROLS */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <button
                      style={styles.qtyBtn}
                      onClick={() => {
                        if (item.qty > 1)
                          updateQty(item.product_id, item.qty - 1);
                        else removeFromCart(item.product_id);
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        width: 20,
                        textAlign: "center",
                        fontWeight: 600,
                      }}
                    >
                      {item.qty}
                    </span>
                    <button
                      style={styles.qtyBtn}
                      onClick={() =>
                        updateQty(item.product_id, item.qty + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product_id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: 13,
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: SUMMARY */}
        <div>
          <div style={styles.card}>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              Summary
            </h3>

            {/* Subtotal: original prices */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontSize: 15,
              }}
            >
              <span style={{ color: "#64748b" }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>
                ${(originalSubtotalCents / 100).toFixed(2)}
              </span>
            </div>

            {/* Discounts applied */}
            {totalSavingsCents > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 16,
                  fontSize: 13,
                  color: "#16a34a",
                }}
              >
                <span>Discounts applied</span>
                <span>- ${(totalSavingsCents / 100).toFixed(2)}</span>
              </div>
            )}

            {/* Shipping row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontSize: 15,
              }}
            >
              <span style={{ color: "#64748b" }}>Shipping</span>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                Calculated at checkout
              </span>
            </div>

            {/* Tax row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
                fontSize: 15,
              }}
            >
              <span style={{ color: "#64748b" }}>Tax</span>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                Calculated at checkout
              </span>
            </div>

            <hr
              style={{
                border: 0,
                borderTop: "1px solid #f1f5f9",
                margin: "16px 0",
              }}
            />

            {/* Total: discounted subtotal (shipping & tax added later) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 24,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              <span>Total</span>
              <span>
                ${(discountedSubtotalCents / 100).toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              style={{
                width: "100%",
                background: "#111",
                color: "#fff",
                padding: "16px",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                opacity: checkingOut ? 0.7 : 1,
              }}
            >
              {checkingOut ? "Redirecting..." : "Checkout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
