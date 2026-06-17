import { useState } from 'react';
import { Label } from './Label';

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  currency?: boolean;
}

export function Field({ label, value, onChange, type = "number", placeholder = "", disabled = false, currency = false }: FieldProps) {
  const [focused, setFocused] = useState(false);

  const displayValue = currency && !focused && Number(value) > 0
    ? formatCOP(Number(value))
    : value;

  const inputType = currency && !focused ? "text" : type;

  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <input
        type={inputType}
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={(e) => { setFocused(true); e.target.style.borderColor = "var(--accent)"; }}
        onBlur={(e) => { setFocused(false); e.target.style.borderColor = "var(--border)"; }}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)",
          background: "var(--surface2)", color: "var(--text1)", fontSize: 15,
          outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)",
          opacity: disabled ? 0.6 : 1,
          fontWeight: currency && !focused && Number(value) > 0 ? 700 : 400,
        }}
      />
    </div>
  );
}
