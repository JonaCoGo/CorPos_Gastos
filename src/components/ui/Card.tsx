import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ children, style = {}, onClick }: CardProps) {
  return (
    <div onClick={onClick} style={{
      background: "var(--surface)", borderRadius: 16, padding: "18px 20px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid var(--border)",
      cursor: onClick ? "pointer" : "default",
      transition: onClick ? "transform 0.15s, box-shadow 0.15s" : "none",
      ...style,
    }}
    onMouseEnter={onClick ? (e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; } : undefined}
    onMouseLeave={onClick ? (e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; } : undefined}
    >{children}</div>
  );
}
