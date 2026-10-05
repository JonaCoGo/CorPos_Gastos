import { useState, useEffect, useRef } from "react";
import { ALL_CATS, MONTH_NAMES } from '../../constants';
import { sanitizeDecimalInput, parseFlexibleNumber } from '../../utils/finanzas';

export function etiquetaMes(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return MONTH_NAMES[m] ? `${MONTH_NAMES[m]} ${y}` : monthKey;
}

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)",
};

export function SearchInput({ value, onChange, style }: { value: string; onChange: (v: string) => void; style?: React.CSSProperties }) {
  return (
    <input
      placeholder="🔍 Buscar producto..."
      value={value} onChange={(e) => onChange(e.target.value)}
      style={{ padding: "9px 12px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none", ...style }}
      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
      onBlur={(e)  => (e.target.style.borderColor = "var(--border)")}
    />
  );
}

export function CategoryChips({ value, onChange }: { value: string; onChange: (cat: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
      {ALL_CATS.map((cat) => (
        <button key={cat} onClick={() => onChange(cat)} style={{
          whiteSpace: "nowrap", padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)",
          background: value === cat ? "var(--accent)" : "var(--surface2)",
          color: value === cat ? "#fff" : "var(--text2)",
        }}>{cat}</button>
      ))}
    </div>
  );
}

export function SupermarketChips({ supermarkets, value, onChange, onAdd }: {
  supermarkets: string[];
  value: string;
  onChange: (s: string) => void;
  onAdd: (name: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {supermarkets.map((s) => (
        <button key={s} onClick={() => onChange(s)} style={{
          padding: "8px 14px", borderRadius: 99, border: "2px solid",
          borderColor: value === s ? "var(--accent)" : "var(--border)",
          background: value === s ? "var(--accent)" : "var(--surface2)",
          color: value === s ? "#fff" : "var(--text2)",
          fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
        }}>{s}</button>
      ))}
      <AddSupermarketChip onAdd={(name) => { onAdd(name); onChange(name); }} />
    </div>
  );
}

// Input de cantidad con buffer de texto propio: si el valor se formatea directo
// desde el número en cada tecla, se pierde el "." mientras se escribe un decimal
// (ej. "1." se re-renderiza como "1"). Mientras el input está enfocado se respeta
// lo que la persona está escribiendo, y solo se sincroniza contra el valor real
// al perder el foco.
export function QtyTextInput({ value, onCommit, style, onClick }: {
  value: number;
  onCommit: (n: number) => void;
  style: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => { if (!focused.current) setText(String(value)); }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onClick={onClick}
      onFocus={() => { focused.current = true; }}
      onBlur={() => { focused.current = false; setText(String(value)); }}
      onChange={(e) => {
        const sanitized = sanitizeDecimalInput(e.target.value);
        setText(sanitized);
        onCommit(parseFlexibleNumber(sanitized) || 1);
      }}
      style={style}
    />
  );
}

function AddSupermarketChip({ onAdd }: { onAdd: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed) onAdd(trimmed);
    setName("");
    setAdding(false);
  };

  if (!adding) {
    return (
      <button onClick={() => setAdding(true)} style={{
        padding: "8px 14px", borderRadius: 99, border: "2px dashed var(--border)",
        background: "transparent", color: "var(--text2)",
        fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
      }}>+ Nuevo</button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 4 }}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setAdding(false); setName(""); } }}
        onBlur={() => { if (!name.trim()) setAdding(false); }}
        placeholder="Nombre del lugar..."
        style={{ padding: "7px 10px", borderRadius: 99, border: "2px solid var(--accent)", background: "var(--surface)", color: "var(--text1)", fontSize: 13, fontFamily: "var(--font-body)", outline: "none", width: 140 }}
      />
      <button onClick={submit} aria-label="Confirmar supermercado" style={{
        padding: "0 12px", borderRadius: 99, border: "none",
        background: "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 700, fontFamily: "var(--font-body)",
      }}>✓</button>
    </div>
  );
}
