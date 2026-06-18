import { Card } from '../components/ui';

interface TabMoreProps {
  onGoTo: (tab: string) => void;
}

const OPTIONS = [
  { id: "salaries", icon: "💰", label: "Salarios",    desc: "Gestiona los salarios del mes y distribución de aportes" },
  { id: "history",  icon: "📅", label: "Historial",   desc: "Navega entre meses anteriores y crea meses nuevos" },
  { id: "settings", icon: "⚙️", label: "Configuración", desc: "Nombres, reinicio del mercado y ajustes generales" },
];

export function TabMore({ onGoTo }: TabMoreProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 4 }}>
        Más opciones
      </div>
      {OPTIONS.map((o) => (
        <Card key={o.id} onClick={() => onGoTo(o.id)} style={{ padding: "16px 20px", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {o.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{o.label}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3 }}>{o.desc}</div>
            </div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "var(--text2)", fontSize: 14, fontWeight: 700 }}>›</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
