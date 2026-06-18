import { PaymentMethod } from '../../types/models';
import { Label } from './Label';

const TYPE_ICON: Record<string, string> = {
  ahorro:   '🏦',
  credito:  '💳',
  efectivo: '💵',
  conjunto: '🤝',
};

interface PaymentChipsProps {
  methods: PaymentMethod[];
  selectedId?: string;
  onChange: (id: string | undefined) => void;
  ownerNames?: { marcela: string; jonatan: string };
  label?: string;
}

export function PaymentChips({ methods, selectedId, onChange, ownerNames, label = "Medio de pago (opcional)" }: PaymentChipsProps) {
  const active = methods.filter((m) => m.active);
  if (active.length === 0) return null;

  const ownerLabel = (owner: string) => {
    if (!ownerNames) return owner;
    if (owner === 'marcela') return ownerNames.marcela;
    if (owner === 'jonatan') return ownerNames.jonatan;
    return 'Conjunto';
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {active.map((m) => {
          const selected = selectedId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(selected ? undefined : m.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 12px", borderRadius: 99,
                border: `2px solid ${selected ? m.color : "var(--border)"}`,
                background: selected ? m.color + "22" : "var(--surface2)",
                cursor: "pointer", fontFamily: "var(--font-body)",
                transition: "all 0.15s",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, flexShrink: 0, display: "inline-block" }} />
              <span style={{ fontSize: 12, fontWeight: selected ? 700 : 500, color: selected ? m.color : "var(--text2)" }}>
                {TYPE_ICON[m.type]} {m.label}
              </span>
              <span style={{ fontSize: 10, color: "var(--text2)", fontWeight: 400 }}>
                {ownerLabel(m.owner)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
