import { useState, useEffect } from "react";
import { Check } from 'lucide-react';
import { Btn, Modal } from '../../components/ui';
import { COP } from '../../utils/finanzas';
import { ResultadoSugerencia, Sugerencia } from '../../utils/sugerencias';
import { etiquetaMes } from './componentes';

interface ModalSugerenciasProps {
  open: boolean;
  onClose: () => void;
  resultado: ResultadoSugerencia;
  onAceptar: (aceptadas: Sugerencia[]) => void;
}

export function ModalSugerencias({ open, onClose, resultado, onAceptar }: ModalSugerenciasProps) {
  const todas = resultado.grupos.flatMap((g) => g.items);
  const [quitadas, setQuitadas] = useState<Set<string>>(new Set());
  useEffect(() => { if (open) setQuitadas(new Set()); }, [open]);

  const toggle = (itemId: string) => setQuitadas((prev) => {
    const next = new Set(prev);
    if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
    return next;
  });

  const aceptadas = todas.filter((s) => !quitadas.has(s.itemId));
  const total = aceptadas.reduce((s, it) => s + it.qty * it.pricePer, 0);
  const meses = resultado.mesesAnalizados.map(etiquetaMes).join(", ");

  return (
    <Modal open={open} onClose={onClose} title="✨ Mercado sugerido">
      {todas.length === 0 ? (
        <>
          <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
            {resultado.mesesAnalizados.length === 0
              ? "Todavía no hay compras de meses anteriores para sugerir. Aparecen a partir del segundo mes registrando el mercado."
              : "No hay nada nuevo que sugerir: lo que suelen comprar ya está en las listas de este mes."}
          </p>
          <Btn variant="secondary" onClick={onClose} style={{ width: "100%" }}>Cerrar</Btn>
        </>
      ) : (
        <>
          <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 16 }}>
            Según {meses}: productos comprados en al menos {resultado.minMeses} de {resultado.mesesAnalizados.length === 1 ? "ese mes" : "esos meses"}, con la cantidad habitual y el último precio. Quita lo que no necesiten.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 18 }}>
            {resultado.grupos.map((g) => (
              <div key={g.supermarket}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 8 }}>
                  {g.supermarket || "Sin lugar"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {g.items.map((s) => {
                    const on = !quitadas.has(s.itemId);
                    return (
                      <button key={s.itemId} onClick={() => toggle(s.itemId)} aria-pressed={on} style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                        padding: "9px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "var(--font-body)",
                        border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`,
                        background: on ? "var(--surface)" : "var(--surface2)",
                      }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: "2px solid",
                          borderColor: on ? "var(--accent)" : "var(--border)", background: on ? "var(--accent)" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{on && <Check size={12} color="#fff" strokeWidth={3} />}</span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: on ? "var(--text1)" : "var(--text2)" }}>{s.itemName}</span>
                          <span style={{ display: "block", fontSize: 11, color: "var(--text2)" }}>
                            {s.qty} {s.unit} · comprado {s.mesesComprado} de {resultado.mesesAnalizados.length} meses
                          </span>
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: on ? "var(--text1)" : "var(--text2)", whiteSpace: "nowrap" }}>≈ {COP(s.qty * s.pricePer)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Btn>
            <Btn variant="primary" onClick={() => onAceptar(aceptadas)} disabled={aceptadas.length === 0} style={{ flex: 2 }}>
              Agregar {aceptadas.length} · ≈ {COP(total)}
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}
