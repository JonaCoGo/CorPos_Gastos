import { RefreshCw } from 'lucide-react';
import { useActualizacionStore } from '../hooks/useActualizacion';

export function BannerActualizacion() {
  const hayNueva     = useActualizacionStore((s) => s.hayNueva);
  const actualizando = useActualizacionStore((s) => s.actualizando);
  const actualizar   = useActualizacionStore((s) => s.actualizar);

  if (!hayNueva) return null;

  return (
    <div role="status" style={{
      display: "flex", alignItems: "center", gap: 10, marginBottom: 12,
      padding: "12px 14px", borderRadius: 14,
      background: "rgba(79,70,229,0.08)", border: "1.5px solid var(--accent)",
    }}>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
        Hay una versión nueva de la app
      </div>
      <button onClick={actualizar} disabled={actualizando} style={{
        display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
        background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10,
        padding: "8px 14px", fontSize: 13, fontWeight: 800, cursor: actualizando ? "default" : "pointer",
        fontFamily: "var(--font-body)", opacity: actualizando ? 0.7 : 1,
      }}>
        <RefreshCw size={14} /> {actualizando ? "Actualizando…" : "Actualizar"}
      </button>
    </div>
  );
}
