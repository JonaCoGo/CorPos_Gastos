import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), 2200);
    const done = setTimeout(onDone, 2600);
    return () => { clearTimeout(hide); clearTimeout(done); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
      background: "#1a1b1f", color: "#fff", borderRadius: 12, padding: "10px 20px",
      fontSize: 13, fontWeight: 600, zIndex: 2000, whiteSpace: "nowrap",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.35s ease",
      pointerEvents: "none",
    }}>
      ✓ {message}
    </div>
  );
}
