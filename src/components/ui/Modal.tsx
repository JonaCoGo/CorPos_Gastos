import { ReactNode, useEffect, useId } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: 20, padding: "24px",
        width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        maxHeight: "90vh", overflowY: "auto", animation: "slideUp 0.2s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 id={titleId} style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ border: "none", background: "var(--surface2)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)" }}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
