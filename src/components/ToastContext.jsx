// ToastContext.jsx
const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]); // ✅ Must default to []

  const addToast = (message, type = "info") => {
    setToasts([...toasts, { message, type }]);
    setTimeout(() => setToasts((prev) => prev.slice(1)), 3000);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast }}>
      {children}
      <Toast /> {/* Render the Toast here if global */}
    </ToastContext.Provider>
  );
};