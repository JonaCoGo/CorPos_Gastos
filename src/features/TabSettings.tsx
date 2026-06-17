import { useState } from "react";
import { Card, Btn, Field, Modal } from '../components/ui';
import { useAppStore } from '../store/useAppStore';

export function TabSettings() {
  const config             = useAppStore((s) => s.data.config);
  const updateConfig       = useAppStore((s) => s.updateConfig);
  const resetMercadoCompras = useAppStore((s) => s.resetMercadoCompras);
  const comprasCount       = useAppStore((s) => s.data.mercado.compras.length);

  const [marcelaName, setMarcelaName] = useState(config?.marcelaName ?? "Marcela");
  const [jonatanName, setJonatanName] = useState(config?.jonatanName ?? "Jonatan");
  const [saved,       setSaved]       = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveNames = () => {
    const trimM = marcelaName.trim() || "Marcela";
    const trimJ = jonatanName.trim() || "Jonatan";
    updateConfig({ marcelaName: trimM, jonatanName: trimJ });
    setMarcelaName(trimM);
    setJonatanName(trimJ);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetMercadoCompras();
    setConfirmReset(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Nombres */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Nombres a mostrar
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>
          Personaliza cómo aparecen los nombres en la app.
        </div>
        <Field
          label="Persona 1"
          value={marcelaName}
          onChange={setMarcelaName}
          type="text"
          placeholder="Nombre"
        />
        <Field
          label="Persona 2"
          value={jonatanName}
          onChange={setJonatanName}
          type="text"
          placeholder="Nombre"
        />
        <Btn
          variant="primary"
          onClick={handleSaveNames}
          disabled={saved}
          style={{ width: "100%" }}
        >
          {saved ? "✅ Guardado" : "Guardar nombres"}
        </Btn>
      </Card>

      {/* Reset mercado */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Reinicio del mercado
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 6 }}>
          Borra todas las compras registradas y deja la lista de productos lista para empezar el mes. Los productos, categorías y precios base <strong>no se eliminan</strong>.
        </div>
        {comprasCount > 0 ? (
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14, padding: "8px 12px", background: "var(--surface2)", borderRadius: 8 }}>
            {comprasCount} compra{comprasCount !== 1 ? "s" : ""} registrada{comprasCount !== 1 ? "s" : ""} actualmente
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--success)", marginBottom: 14, padding: "8px 12px", background: "#f0fdf4", borderRadius: 8 }}>
            ✅ Sin compras — el mercado ya está en cero
          </div>
        )}
        <Btn
          variant="danger"
          onClick={() => setConfirmReset(true)}
          disabled={comprasCount === 0}
          style={{ width: "100%" }}
        >
          Reiniciar compras del mercado
        </Btn>
      </Card>

      {/* Modal confirmación reset */}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="¿Reiniciar mercado?">
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 8 }}>
          Se eliminarán <strong>{comprasCount} compra{comprasCount !== 1 ? "s" : ""}</strong> del historial.
        </p>
        <p style={{ color: "var(--text2)", fontSize: 14, marginBottom: 20 }}>
          Los productos, categorías y precios base quedan intactos.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="secondary" onClick={() => setConfirmReset(false)} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn variant="danger" onClick={handleReset} style={{ flex: 1 }}>Sí, reiniciar</Btn>
        </div>
      </Modal>
    </div>
  );
}
