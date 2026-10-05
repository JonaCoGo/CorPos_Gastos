import { useState } from "react";
import { Mercado } from '../../types/models';
import { useAppStore } from '../../store/useAppStore';
import { useMercadoConfig } from './useMercadoConfig';
import { useCarrito } from './useCarrito';
import { VistaLista } from './VistaLista';
import { VistaHacer } from './VistaHacer';
import { VistaHistorial } from './VistaHistorial';
import { VistaItems } from './VistaItems';

interface TabMercadoProps {
  mercado: Mercado;
  onUpdate: (data: Mercado) => void;
}

type Vista = "lista" | "hacer" | "historial" | "productos";

const VISTAS: { id: Vista; label: string }[] = [
  { id: "lista",     label: "📋 Lista" },
  { id: "hacer",     label: "🛒 Hacer" },
  { id: "historial", label: "🧾 Historial" },
  { id: "productos", label: "🧺 Items" },
];

export function TabMercado({ mercado, onUpdate }: TabMercadoProps) {
  const { supermarkets } = useMercadoConfig();
  const lista = mercado?.lista || [];
  const [view, setView] = useState<Vista>("lista");
  const monthKey = useAppStore((s) => s.data.currentKey);
  const carrito = useCarrito(mercado, onUpdate, supermarkets[0], monthKey);

  const cargarLista = () => { if (carrito.cargarLista()) setView("hacer"); };
  const registrar   = () => { if (carrito.registrarViaje()) setView("historial"); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 12, padding: 4, gap: 4 }}>
        {VISTAS.map((v) => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            flex: 1, padding: "8px 0", border: "none", borderRadius: 9, cursor: "pointer",
            background: view === v.id ? "var(--surface)" : "transparent",
            color: view === v.id ? "var(--text1)" : "var(--text2)",
            fontWeight: view === v.id ? 700 : 500, fontSize: 10, fontFamily: "var(--font-body)",
            boxShadow: view === v.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s",
            position: "relative",
          }}>
            {v.label}
            {v.id === "lista" && lista.length > 0 && (
              <span style={{ position: "absolute", top: 2, right: 4, background: "var(--accent)", color: "#fff", borderRadius: 99, fontSize: 9, fontWeight: 900, padding: "1px 5px", lineHeight: 1.4 }}>
                {lista.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {view === "lista"     && <VistaLista mercado={mercado} onUpdate={onUpdate} onIrAlMercado={cargarLista} />}
      {view === "hacer"     && <VistaHacer mercado={mercado} carrito={carrito} onCargarLista={cargarLista} onRegistrar={registrar} onIrAItems={() => setView("productos")} monthKey={monthKey} />}
      {view === "historial" && <VistaHistorial mercado={mercado} onUpdate={onUpdate} monthKey={monthKey} />}
      {view === "productos" && <VistaItems mercado={mercado} onUpdate={onUpdate} />}
    </div>
  );
}
