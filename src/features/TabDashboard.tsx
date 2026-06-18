import { Avatar, ProgressBar, Card } from '../components/ui';
import { MONTH_NAMES } from '../constants';
import { COP } from '../utils/finanzas';
import { MonthData, ResumenFinanciero, Mercado } from '../types/models';
import { useAppStore } from '../store/useAppStore';

interface TabDashboardProps {
  monthData: MonthData;
  summary: ResumenFinanciero;
  mercado: Mercado;
}

export function TabDashboard({ monthData, summary, mercado }: TabDashboardProps) {
  const config = useAppStore((s) => s.data.config);
  const names = {
    marcela: config?.marcelaName ?? "Marcela",
    jonatan: config?.jonatanName ?? "Jonatan",
  };

  const { ratio, totalNeto, netoMarcela, netoJonatan,
    personalTotalMarcela, personalTotalJonatan,
    extrasTotalMarcela, extrasTotalJonatan,
    totalFamilyBudget, totalFamilyPaid, totalFamilyPending,
    totalFamilyPaidMarcela, totalFamilyPaidJonatan,
    aporteFamiliarMarcela, aporteFamiliarJonatan,
    aportePagadoIdealMarcela, aportePagadoIdealJonatan,
    saldoMarcela, saldoJonatan } = summary;

  // Calcular faltantes para llegar al ideal
  const faltanteMarcela = Math.max(0, aporteFamiliarMarcela - totalFamilyPaidMarcela);
  const faltanteJonatan = Math.max(0, aporteFamiliarJonatan - totalFamilyPaidJonatan);

  // Resumen por medio de pago
  const paymentMethods = config?.paymentMethods ?? [];
  const pmTotals: Record<string, number> = {};
  if (paymentMethods.length > 0) {
    monthData.familyExpenses.forEach((e) => { if (e.paymentMethodId) pmTotals[e.paymentMethodId] = (pmTotals[e.paymentMethodId] || 0) + (e.marcela || 0) + (e.jonatan || 0); });
    (monthData.personalExpenses?.marcela || []).forEach((e) => { if (e.paymentMethodId) pmTotals[e.paymentMethodId] = (pmTotals[e.paymentMethodId] || 0) + e.amount; });
    (monthData.personalExpenses?.jonatan || []).forEach((e) => { if (e.paymentMethodId) pmTotals[e.paymentMethodId] = (pmTotals[e.paymentMethodId] || 0) + e.amount; });
    (monthData.extras || []).forEach((e) => { if (e.paymentMethodId) pmTotals[e.paymentMethodId] = (pmTotals[e.paymentMethodId] || 0) + e.amount; });
    (mercado?.compras || []).forEach((c) => { if (c.paymentMethodId) pmTotals[c.paymentMethodId] = (pmTotals[c.paymentMethodId] || 0) + c.total; });
  }
  const pmEntries = paymentMethods.filter((m) => pmTotals[m.id] > 0).sort((a, b) => (pmTotals[b.id] || 0) - (pmTotals[a.id] || 0));
  const pmGrandTotal = pmEntries.reduce((s, m) => s + (pmTotals[m.id] || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Salarios */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
          Salarios — {MONTH_NAMES[monthData.month]} {monthData.year}
        </div>
        {[
          { n: "marcela", label: names.marcela, bruto: monthData.salaries.marcela, personal: personalTotalMarcela, neto: netoMarcela },
          { n: "jonatan", label: names.jonatan, bruto: monthData.salaries.jonatan, personal: personalTotalJonatan, neto: netoJonatan },
        ].map(({ n, label, bruto, personal, neto }) => (
          <div key={n} style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Avatar name={label} persona={n} size={26} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text2)" }}>{(ratio[n as keyof typeof ratio] * 100).toFixed(1)}% del aporte</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text2)" }}>Salario bruto</span>
                <span style={{ fontWeight: 600 }}>{COP(bruto)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--text2)" }}>− Gastos personales</span>
                <span style={{ fontWeight: 600, color: "var(--danger)" }}>−{COP(personal)}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Neto disponible</span>
                <span style={{ fontSize: 17, fontWeight: 900, color: n === "marcela" ? "var(--marce)" : "var(--jona)", fontFamily: "var(--font-display)" }}>{COP(neto)}</span>
              </div>
            </div>
          </div>
        ))}
        <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: 10, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "var(--text2)" }}>Total neto disponible</span>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{COP(totalNeto)}</span>
        </div>
      </Card>

      {/* Gastos familiares */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>Gastos del Hogar</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text2)" }}>Pagado</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{COP(totalFamilyPaid)} / {COP(totalFamilyBudget)}</span>
        </div>
        <ProgressBar value={totalFamilyPaid} max={totalFamilyBudget} height={10} />
        <div style={{ marginTop: 12 }}>
          {totalFamilyPending > 0 ? (
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--danger)" }}>⏳ Por pagar</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--danger)" }}>{COP(totalFamilyPending)}</span>
            </div>
          ) : totalFamilyPaid > 0 ? (
            <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
              <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>✅ ¡Todos los gastos cubiertos!</span>
            </div>
          ) : null}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          {[{ label: `Pagó ${names.marcela}`, val: totalFamilyPaidMarcela, n: "marcela", ideal: aportePagadoIdealMarcela },
            { label: `Pagó ${names.jonatan}`, val: totalFamilyPaidJonatan, n: "jonatan", ideal: aportePagadoIdealJonatan }].map(({ label, val, n, ideal }) => (
            <div key={n} style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: `var(--${n})` }}>{COP(val)}</div>
              <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 3 }}>Ideal: {COP(ideal)}</div>
            </div>
          ))}
        </div>
        {(faltanteMarcela >= 1000 || faltanteJonatan >= 1000) && (<div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12 }}>
            {faltanteMarcela >= 1000 && (<div style={{ color: "var(--danger)", marginBottom: 4 }}>
                {names.marcela} le falta pagar {COP(faltanteMarcela)} para llegar al ideal</div>
            )}
            {faltanteJonatan >= 1000 && (<div style={{ color: "var(--danger)" }}>
                {names.jonatan} le falta pagar {COP(faltanteJonatan)} para llegar al ideal</div>
            )}</div>
        )}
      </Card>

      {/* Saldo libre */}
      <Card>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>Saldo Libre Estimado</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[{ n: "marcela", label: names.marcela, saldo: saldoMarcela, aporte: aporteFamiliarMarcela },
            { n: "jonatan", label: names.jonatan, saldo: saldoJonatan, aporte: aporteFamiliarJonatan }].map(({ n, label, saldo, aporte }) => (
            <div key={n} style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Avatar name={label} persona={n} size={24} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>{label}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>Aporte ideal al hogar</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{COP(aporte)}</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>Gastos extra</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)", marginBottom: 8 }}>−{COP(n === "marcela" ? extrasTotalMarcela : extrasTotalJonatan)}</div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>Queda libre</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: saldo >= 0 ? "var(--success)" : "var(--danger)", fontFamily: "var(--font-display)" }}>
                  {COP(saldo)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--text2)", padding: "8px 10px", background: "var(--surface2)", borderRadius: 8 }}>
          Saldo libre = neto disponible − aporte proporcional al hogar
        </div>
      </Card>

      {/* Resumen por medio de pago */}
      {pmEntries.length > 0 && (
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text2)", marginBottom: 14 }}>
            Pagado por cuenta
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pmEntries.map((m) => {
              const total = pmTotals[m.id] || 0;
              const pct = pmGrandTotal > 0 ? (total / pmGrandTotal) * 100 : 0;
              return (
                <div key={m.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.color }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</span>
                      <span style={{ fontSize: 11, color: "var(--text2)" }}>
                        {m.owner === "marcela" ? names.marcela : m.owner === "jonatan" ? names.jonatan : "Los dos"}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{COP(total)}</span>
                  </div>
                  <ProgressBar value={total} max={pmGrandTotal} color={m.color} height={6} />
                  <div style={{ fontSize: 10, color: "var(--text2)", textAlign: "right", marginTop: 2 }}>{pct.toFixed(1)}%</div>
                </div>
              );
            })}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>Total rastreado</span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>{COP(pmGrandTotal)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
