// Toast.jsx
import { useToast } from "../context/ToastContext";

export default function Toast() {
  const { toasts } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast, index) => (
        <div key={index} className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}