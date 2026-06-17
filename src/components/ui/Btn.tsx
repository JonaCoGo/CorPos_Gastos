import { ReactNode, CSSProperties } from 'react';

interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "marce" | "jona" | "ghost";
  style?: CSSProperties;
  disabled?: boolean;
}

export function Btn({ children, onClick, variant = "primary", style = {}, disabled = false }: BtnProps) {
  const variants = {
    primary: { background: "var(--accent)", color: "#fff" },
    secondary: { background: "var(--surface2)", color: "var(--text1)" },
    danger: { background: "#fee2e2", color: "var(--danger)" },
    marce: { background: "var(--marce)", color: "#fff" },
    jona: { background: "var(--jona)", color: "#fff" },
    ghost: { background: "none", color: "var(--text2)", border: "1.5px solid var(--border)" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      padding: "10px 18px", borderRadius: 10, border: "none", cursor: disabled ? "default" : "pointer",
      fontWeight: 700, fontSize: 14, fontFamily: "var(--font-body)", opacity: disabled ? 0.5 : 1,
      transition: "opacity 0.15s, transform 0.1s",
      ...variants[variant], ...style,
    }}>{children}</button>
  );
}
