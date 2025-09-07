import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 300,
      }}>
        {toasts.map(({ id, message, type }) => (
          <div
            key={id}
            style={{
              padding: "10px 15px",
              borderRadius: 6,
              color: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              backgroundColor:
                type === "error" ? "#e74c3c" :
                type === "success" ? "#2ecc71" :
                "#3498db",
              fontWeight: "bold",
            }}
          >
            {message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}