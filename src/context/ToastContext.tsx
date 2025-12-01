// src/context/ToastContext.tsx
import { createContext, useContext, useState, ReactNode, useCallback } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* TOAST CONTAINER (Fixed Overlay) */}
      <div style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 9999,
        pointerEvents: "none" // Let clicks pass through empty space
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            background: t.type === "error" ? "#fee2e2" : "#111827",
            color: t.type === "error" ? "#b91c1c" : "#fff",
            padding: "12px 20px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "Inter, sans-serif",
            animation: "slideIn 0.3s ease-out",
            pointerEvents: "auto", // Re-enable clicks on the toast itself
            minWidth: 200,
          }}>
            {/* Simple Icons */}
            {t.type === "success" && <span>✅</span>}
            {t.type === "error" && <span>⚠️</span>}
            {t.message}
          </div>
        ))}
      </div>
      
      {/* Animation Styles */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}