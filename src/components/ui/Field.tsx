import { useState } from 'react';
import { Label } from './Label';
import { sanitizeDecimalInput } from '../../utils/finanzas';

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

  // Los inputs numéricos van como texto + teclado decimal: type="number" nativo
  // depende del separador decimal del teclado del celular (a veces exige "," y
  // rechaza "."), lo que hace que no se pueda escribir el peso que da la báscula.
  const isNumeric = type === "number";
  const inputType = currency && !focused ? "text" : isNumeric ? "text" : type;

  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <input
        type={inputType}
        inputMode={isNumeric ? "decimal" : undefined}
        value={displayValue}
        onChange={(e) => onChange(isNumeric ? sanitizeDecimalInput(e.target.value) : e.target.value)}
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
