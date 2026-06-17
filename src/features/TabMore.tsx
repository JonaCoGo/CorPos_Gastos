import { Card } from '../components/ui';

interface TabMoreProps {
  onGoTo: (tab: string) => void;
}

const OPTIONS = [
  { id: "salaries", icon: "💰", label: "Salarios",  desc: "Gestiona los salarios del mes y distribución de aportes" },
  { id: "history",  icon: "📅", label: "Historial", desc: "Navega entre meses anteriores y crea meses nuevos" },
];

export function TabMore({ onGoTo }: TabMoreProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 4 }}>
        Más opciones
      </div>
      {OPTIONS.map((o) => (
        <Card key={o.id} onClick={() => onGoTo(o.id)} style={{ padding: "18px 20px", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 32 }}>{o.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>{o.desc}</div>
            </div>
            <span style={{ marginLeft: "auto", color: "var(--text2)", fontSize: 18 }}>›</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
