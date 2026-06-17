import { ReactNode } from 'react';
import { Label } from './Label';

interface SelectProps {
  label?: string;
  value: string | number;
  onChange: (val: string) => void;
  children: ReactNode;
}

export function Select({ label, value, onChange, children }: SelectProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <Label>{label}</Label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 10,
          border: "1.5px solid var(--border)", background: "var(--surface2)",
          color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)",
          outline: "none", cursor: "pointer",
        }}
      >
        {children}
      </select>
    </div>
  );
}
