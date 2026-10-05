import { useMemo } from "react";
import { Card } from '../../components/ui';
import { COP } from '../../utils/finanzas';
import { informeMercado, FilaInforme } from '../../utils/informe';
import { Mercado } from '../../types/models';
import { SelectorMes, etiquetaMes, sectionTitleStyle, useMesConsultado } from './componentes';

interface VistaInformeProps {
  mercado: Mercado;
  monthKey: string;
}

const pct = (n: number) => `${Math.round(Math.abs(n))}%`;

// Variación vs. el promedio: flecha + texto, nunca solo color.
function Variacion({ valor, base }: { valor: number | null; base: string }) {
  if (valor === null) return null;
  if (Math.round(valor) === 0) return <span>≈ igual que {base}</span>;
  return <span>{valor > 0 ? "▲" : "▼"} {pct(valor)} {valor > 0 ? "más" : "menos"} que {base}</span>;
}

export function VistaInforme({ mercado, monthKey }: VistaInformeProps) {
  const compras = mercado?.compras || [];
  const { mes, setMes, opciones } = useMesConsultado(compras, monthKey);
  const inf = useMemo(() => informeMercado(compras, mes), [compras, mes]);
  const nComparados = inf.mesesComparados.length;
  const basePromedio = nComparados === 1 ? "el mes anterior" : `el promedio de ${nComparados} meses`;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={sectionTitleStyle}>Informe del mercado</div>
        <SelectorMes value={mes} onChange={setMes} opciones={opciones} monthKey={monthKey} ariaLabel="Mes del informe" />
      </div>

      {inf.total === 0 ? (
        <Card style={{ textAlign: "center", padding: "36px 20px" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sin compras en {etiquetaMes(mes)}</div>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>El informe aparece cuando registren el primer viaje del mes.</div>
        </Card>
      ) : (
        <>
          {/* Cifra principal */}
          <Card>
            <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>Total mercado · {etiquetaMes(mes)}</div>
            <div style={{ fontSize: 30, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--text1)", lineHeight: 1.1 }}>{COP(inf.total)}</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>
              {inf.viajes} viaje{inf.viajes !== 1 ? "s" : ""} · {inf.porCategoria.length} categoría{inf.porCategoria.length !== 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", marginTop: 8 }}>
              {nComparados === 0
                ? <span style={{ color: "var(--text2)", fontWeight: 500 }}>Primer mes con compras: todavía no hay con qué comparar.</span>
                : <><Variacion valor={inf.variacionPct} base={basePromedio} /> <span style={{ color: "var(--text2)", fontWeight: 500 }}>({COP(inf.promedioAnterior ?? 0)})</span></>}
            </div>
          </Card>

          <Card>
            <div style={{ ...sectionTitleStyle, marginBottom: 12 }}>Por categoría</div>
            <ListaBarras filas={inf.porCategoria} basePromedio={nComparados > 0 ? basePromedio : null} />
          </Card>

          <Card>
            <div style={{ ...sectionTitleStyle, marginBottom: 12 }}>Por lugar de compra</div>
            <ListaBarras filas={inf.porSupermercado} basePromedio={nComparados > 0 ? basePromedio : null} />
          </Card>

          <Card>
            <div style={{ ...sectionTitleStyle, marginBottom: 12 }}>Productos que más pesaron</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {inf.topProductos.map((p, i) => (
                <div key={p.itemId} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", width: 16 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>{p.nombre}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>{Math.round(p.qty * 100) / 100} {p.unit}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text1)" }}>{COP(p.total)}</span>
                </div>
              ))}
            </div>
          </Card>

          {inf.cambiosPrecio.length > 0 && (
            <Card>
              <div style={{ ...sectionTitleStyle, marginBottom: 4 }}>Cambios de precio</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>Último precio del mes vs. la compra anterior</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {inf.cambiosPrecio.map((c) => {
                  const sube = c.variacionPct > 0;
                  return (
                    <div key={c.itemId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)" }}>{c.nombre}</div>
                        <div style={{ fontSize: 11, color: "var(--text2)" }}>{COP(c.precioAnterior)} → {COP(c.precioActual)} /{c.unit}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: sube ? "var(--danger)" : "var(--success)", whiteSpace: "nowrap" }}>
                        {sube ? "▲ subió" : "▼ bajó"} {pct(c.variacionPct)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </>
  );
}

// Barras horizontales de una sola serie: un color para todas, largo relativo a la
// mayor, valor y % en texto (no dentro de la barra).
function ListaBarras({ filas, basePromedio }: { filas: FilaInforme[]; basePromedio: string | null }) {
  const max = Math.max(...filas.map((f) => f.total), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {filas.map((f) => (
        <div key={f.nombre}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nombre}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)", whiteSpace: "nowrap" }}>
              {COP(f.total)} <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)" }}>· {pct(f.pct)}</span>
            </span>
          </div>
          <div style={{ height: 8, background: "var(--surface2)", borderRadius: 4 }}>
            <div style={{ width: `${(f.total / max) * 100}%`, minWidth: 4, height: "100%", background: "var(--accent)", borderRadius: 4 }} />
          </div>
          {basePromedio && (
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>
              {f.variacionPct === null
                ? "Nuevo: no se compraba en los meses anteriores"
                : <Variacion valor={f.variacionPct} base={basePromedio} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
