import { useState } from "react";
import { Avatar, Card, Btn, Field, ProgressBar } from '../components/ui';
import { MONTH_NAMES } from '../constants';
import { COP } from '../utils/finanzas';
import { MonthData } from '../types/models';
import { useAppStore } from '../store/useAppStore';

interface TabSalariesProps {
  monthData: MonthData;
  onUpdate: (data: MonthData) => void;
}

export function TabSalaries({ monthData, onUpdate }: TabSalariesProps) {
  const config = useAppStore((s) => s.data.config);
  const names = { marcela: config?.marcelaName ?? "Marcela", jonatan: config?.jonatanName ?? "Jonatan" };

  const personalTotalMarcela = (monthData.personalExpenses?.marcela || []).reduce((s, e) => s + (e.amount || 0), 0);
  const personalTotalJonatan = (monthData.personalExpenses?.jonatan || []).reduce((s, e) => s + (e.amount || 0), 0);

  const [form, setForm] = useState({
    marcela: monthData.salaries.marcela || "",
    jonatan: monthData.salaries.jonatan || "",
  });

  const [fondo, setFondo] = useState({
    marcela: monthData.fondoConjunto?.aporteMarcela || "",
    jonatan: monthData.fondoConjunto?.aporteJonatan || "",
  });

  const save = () => {
    onUpdate({ ...monthData, salaries: { marcela: Number(form.marcela) || 0, jonatan: Number(form.jonatan) || 0 } });
  };

  const saveFondo = () => {
    onUpdate({
      ...monthData,
      fondoConjunto: {
        aporteMarcela: Number(fondo.marcela) || 0,
        aporteJonatan: Number(fondo.jonatan) || 0,
      },
    });
  };

  const totalFondo = (Number(fondo.marcela) || 0) + (Number(fondo.jonatan) || 0);

  const netoMarce = Math.max(0, (Number(form.marcela) || 0) - personalTotalMarcela);
  const netoJona  = Math.max(0, (Number(form.jonatan)  || 0) - personalTotalJonatan);
  const totalNeto = netoMarce + netoJona;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 4 }}>
          Salarios — {MONTH_NAMES[monthData.month]} {monthData.year}
        </div>
        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 16, padding: "8px 10px", background: "var(--surface2)", borderRadius: 8, lineHeight: 1.6 }}>
          Ingresa el <strong>salario bruto</strong> de cada uno. La app descuenta los gastos personales automáticamente para calcular el neto y los aportes al hogar.
        </div>
        {[
          { n: "marcela", neto: netoMarce, personal: personalTotalMarcela },
          { n: "jonatan", neto: netoJona,  personal: personalTotalJonatan },
        ].map(({ n, neto, personal }) => (
          <div key={n} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Avatar name={n} size={22} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{names[n as keyof typeof names]}</span>
            </div>
            <Field
              label="Salario bruto"
              value={form[n as keyof typeof form]}
              onChange={(v) => setForm({ ...form, [n]: v })}
              placeholder="Ej: 2000000"
              currency
            />
            {(Number(form[n as keyof typeof form]) > 0) && (
              <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, display: "flex", flexDirection: "column", gap: 5, marginTop: -6, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text2)" }}>
                  <span>− Gastos personales</span>
                  <span style={{ color: "var(--danger)", fontWeight: 600 }}>−{COP(personal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 6 }}>
                  <span style={{ fontWeight: 700 }}>Neto disponible</span>
                  <span style={{ fontWeight: 800, color: n === "marcela" ? "var(--marce)" : "var(--jona)" }}>{COP(neto)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        <Btn variant="primary" onClick={save} style={{ width: "100%", marginTop: 4 }}>Guardar salarios</Btn>
      </Card>

      {/* Fondo conjunto */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 4 }}>
          🤝 Fondo Conjunto
        </div>
        <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 16, padding: "8px 10px", background: "var(--surface2)", borderRadius: 8, lineHeight: 1.6 }}>
          Registra cuánto transfirió cada uno al fondo común este mes. Este monto se descuenta de tu saldo libre.
        </div>
        {[
          { n: "marcela", label: names.marcela },
          { n: "jonatan", label: names.jonatan },
        ].map(({ n, label }) => (
          <div key={n} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Avatar name={label} persona={n} size={22} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
            </div>
            <Field
              label="Aporte al fondo"
              value={fondo[n as keyof typeof fondo]}
              onChange={(v) => setFondo({ ...fondo, [n]: v })}
              placeholder="Ej: 300000"
              currency
            />
          </div>
        ))}
        {totalFondo > 0 && (
          <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text2)" }}>Total fondo este mes</span>
            <span style={{ fontWeight: 800, color: "var(--accent)" }}>{COP(totalFondo)}</span>
          </div>
        )}
        <Btn variant="primary" onClick={saveFondo} style={{ width: "100%", marginTop: 4 }}>Guardar fondo</Btn>
      </Card>

      {totalNeto > 0 && (
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>Distribución de aportes (sobre neto)</div>
          {[{ n: "marcela", v: netoMarce }, { n: "jonatan", v: netoJona }].map(({ n, v }) => {
            const pct = totalNeto > 0 ? (v / totalNeto * 100).toFixed(1) : 0;
            return (
              <div key={n} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Avatar name={n} size={20} />
                    <span style={{ fontWeight: 600 }}>{names[n as keyof typeof names]}</span>
                  </span>
                  <span style={{ color: "var(--text2)" }}>{pct}% · {COP(v)}</span>
                </div>
                <ProgressBar value={v} max={totalNeto} color={n === "marcela" ? "var(--marce)" : "var(--jona)"} height={8} />
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
