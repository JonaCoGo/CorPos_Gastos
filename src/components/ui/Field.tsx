import { Label } from './Label';

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function Field({ label, value, onChange, type = "number", placeholder = "", disabled = false }: FieldProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--border)",
          background: "var(--surface2)", color: "var(--text1)", fontSize: 15,
          outline: "none", boxSizing: "border-box", fontFamily: "var(--font-body)",
          opacity: disabled ? 0.6 : 1,
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}
